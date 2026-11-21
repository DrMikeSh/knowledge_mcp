import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const workspace = await realpath(process.argv[2] ?? fileURLToPath(new URL('../', import.meta.url)));
const localOpencode = join(homedir(), '.opencode', 'bin', 'opencode');
const opencode = process.env.OPENCODE_BIN ?? (existsSync(localOpencode) ? localOpencode : 'opencode');
const html = await readFile(new URL('index.html', import.meta.url));
const roles = [
  ['factory-manager', 'Manager'],
  ['coder', 'Coder'],
  ['reviewer', 'Reviewer'],
];

async function apiResponse(...args) {
  const { stdout } = await run(opencode, ['api', ...args], {
    cwd: workspace, timeout: 6000, maxBuffer: 8 * 1024 * 1024,
  });
  const response = JSON.parse(stdout);
  if (response.data == null) throw new Error('Missing OpenCode response data');
  return response;
}

async function api(...args) {
  return (await apiResponse(...args)).data;
}

function brief(value) {
  const text = value?.replace(/^Run the Software Factory process for:\s*/i, '')
    .replace(/\s+/g, ' ').trim() ?? '';
  return text.length > 220 ? `${text.slice(0, 219)}…` : text;
}

function tokenUsage(tokens) {
  if (!tokens) return null;
  const input = tokens.input ?? 0;
  const output = tokens.output ?? 0;
  const reasoning = tokens.reasoning ?? 0;
  const cacheRead = tokens.cache?.read ?? 0;
  const cacheWrite = tokens.cache?.write ?? 0;
  return { total: input + output + reasoning + cacheRead + cacheWrite, input, output, reasoning, cacheRead, cacheWrite };
}

const toolCache = new Map();
async function toolUsage(session) {
  const updated = session.time?.updated;
  const cached = toolCache.get(session.id);
  if (updated != null && cached?.updated === updated) return cached.tools;

  const counts = new Map();
  const query = new URLSearchParams({ type: 'assistant', limit: '40', order: 'desc' });
  try {
    while (true) {
      const { data: messages, cursor } = await apiResponse('GET',
        `/api/session/${encodeURIComponent(session.id)}/message?${query}`);
      for (const message of messages) {
        for (const part of message.content ?? []) {
          if (part.type === 'tool' && part.name) counts.set(part.name, (counts.get(part.name) ?? 0) + 1);
        }
      }
      if (!messages.length || !cursor?.next) break;
      query.delete('order');
      query.set('cursor', cursor.next);
    }
  } catch {
    return null;
  }
  const tools = [...counts].map(([name, calls]) => ({ name, calls }))
    .sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name));
  toolCache.set(session.id, { updated, tools });
  return tools;
}

async function task(session, parent, status) {
  const tools = toolUsage(session);
  let title = brief(session.title);
  if (session.agent === 'factory-manager' || !title) {
    try {
      const messages = await api('GET', `/api/session/${encodeURIComponent(session.id)}/message?type=user&limit=1&order=desc`);
      title = brief(messages[0]?.text) || title;
    } catch {
      // The session title is still available if the transcript is unavailable.
    }
  }
  return {
    id: session.id,
    title: title || 'Task details pending',
    parent: parent ? brief(parent.title) : '',
    status,
    updated: session.time?.updated ?? session.time?.created ?? null,
    tokens: tokenUsage(session.tokens),
    tools: await tools,
  };
}

async function activity() {
  const [recent, active] = await Promise.all([
    api('session.list', '--param', `directory=${workspace}`, '--param', 'limit=80'),
    api('session.active'),
  ]);
  if (!Array.isArray(recent) || Array.isArray(active)) throw new Error('Unexpected OpenCode session format');

  const sessions = new Map(recent.map(session => [session.id, session]));
  const activeIDs = new Set(Object.keys(active));
  // An older run can resume after it has dropped out of the recent session list.
  await Promise.all([...activeIDs].filter(id => !sessions.has(id)).map(async id => {
    try {
      const session = await api('GET', `/api/session/${encodeURIComponent(id)}`);
      if (session.location?.directory === workspace) sessions.set(id, session);
    } catch {
      // The session may have ended or been removed between requests.
    }
  }));

  const waiting = new Set([...sessions.values()]
    .filter(session => activeIDs.has(session.id) && ['coder', 'reviewer'].includes(session.agent))
    .map(session => session.parentID).filter(Boolean));
  const ordered = [...sessions.values()]
    .sort((a, b) => (b.time?.updated ?? b.time?.created ?? 0) - (a.time?.updated ?? a.time?.created ?? 0));

  const agents = await Promise.all(roles.map(async ([id, name]) => {
    const matches = ordered.filter(session => session.agent === id);
    const current = matches.filter(session => activeIDs.has(session.id) || waiting.has(session.id));
    const shown = current.length ? current : matches.slice(0, 1);
    const tasks = await Promise.all(shown.map(session => task(
      session, sessions.get(session.parentID),
      activeIDs.has(session.id) ? 'Working' : waiting.has(session.id) ? 'Waiting for agent' : 'Last task',
    )));
    return { id, name, tasks };
  }));
  const visible = new Set(agents.flatMap(agent => agent.tasks.map(item => item.id)));
  for (const id of toolCache.keys()) if (!visible.has(id)) toolCache.delete(id);
  return { agents, checkedAt: Date.now() };
}

let pending;
let lastSnapshot;
async function snapshot() {
  if (lastSnapshot && Date.now() - lastSnapshot.checkedAt < 1500) return lastSnapshot;
  pending ??= activity().then(result => {
    lastSnapshot = result;
    return result;
  }).finally(() => { pending = undefined; });
  return pending;
}

const server = createServer(async (request, response) => {
  const port = server.address().port;
  const url = URL.parse(request.url, 'http://127.0.0.1');
  const isActivity = url?.pathname === '/api/activity'
    || (url?.pathname === '/' && url.searchParams.get('activity') === '1');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  response.setHeader('X-Frame-Options', 'DENY');
  if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(request.headers.host)
      || (isActivity && request.headers['sec-fetch-site'] === 'cross-site')) {
    response.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify({
      error: 'Activity access was blocked. Open the local URL printed by the dashboard server.',
    }));
    return;
  }
  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' }).end();
    return;
  }
  if (isActivity) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      response.end(JSON.stringify(await snapshot()));
    } catch {
      response.writeHead(503).end(JSON.stringify({
        error: 'OpenCode is unavailable. Check the local service and its CLI, then leave this page open to retry.',
      }));
    }
  } else if (url?.pathname === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
  } else {
    response.writeHead(404).end();
  }
});

server.listen(Number(process.env.PORT ?? 4318), '127.0.0.1', () => {
  console.log(`Factory dashboard: http://127.0.0.1:${server.address().port}/`);
});
