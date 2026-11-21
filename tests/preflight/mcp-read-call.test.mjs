import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client';
import { Server } from '@modelcontextprotocol/sdk/server';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const selectedProject = {
  id: 'proj-atlas',
  name: 'Atlas',
  brief: 'Fixture brief describing the Atlas project scope and context.'
};

const pages = [
  { id: 'page-1', title: 'Overview', position: 1 },
  { id: 'page-2', title: 'Decisions', position: 2 },
  { id: 'page-3', title: 'Notes', position: 3 }
];

const activePage = pages[0];
const selectionVersion = 7;

const contentText =
  `Opened ${selectedProject.name} (${selectedProject.id}). ` +
  `Brief: ${selectedProject.brief} ` +
  `Pages: ${pages.map((page) => page.title).join(', ')}. ` +
  `Active page: ${activePage.title}. ` +
  `Selection version: ${selectionVersion}.`;

function createProjectOpenHandler() {
  return async (request) => {
    if (request.params.name !== 'project_open') {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
        isError: true
      };
    }

    if (
      request.params.arguments?.project_id !== undefined &&
      typeof request.params.arguments.project_id !== 'string'
    ) {
      return {
        content: [{ type: 'text', text: 'Invalid argument: project_id must be a string.' }],
        isError: true
      };
    }

    return {
      content: [{ type: 'text', text: contentText }],
      structuredContent: {
        selected_project: selectedProject,
        pages,
        active_page: activePage,
        selection_version: selectionVersion
      }
    };
  };
}

test('project_open returns the selected project, ordered pages and selection version', { timeout: 5000 }, async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const server = new Server(
    { name: 'mcp-read-call-test-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(CallToolRequestSchema, createProjectOpenHandler());

  const client = new Client({ name: 'mcp-read-call-test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({ name: 'project_open', arguments: {} });

    assert.equal(result.content.length, 1, 'response has exactly one content item');
    assert.equal(result.content[0].type, 'text', 'content item is human-readable text');
    assert.ok(result.content[0].text.includes(selectedProject.brief), 'text includes the project brief');
    assert.match(result.content[0].text, /Opened Atlas \(proj-atlas\)\./, 'text names the selected project');
    assert.match(result.content[0].text, /Pages: Overview, Decisions, Notes\./, 'text lists the pages in order');
    assert.match(result.content[0].text, /Active page: Overview\./, 'text names the active page');
    assert.match(result.content[0].text, /Selection version: 7\./, 'text states the selection version');
    assert.deepEqual(result.structuredContent.selected_project, selectedProject, 'structured selected_project matches the fixture');
    assert.deepEqual(result.structuredContent.pages, pages, 'structured pages are ordered and complete');
    assert.deepEqual(result.structuredContent.active_page, activePage, 'structured active page matches the fixture');
    assert.equal(result.structuredContent.selection_version, selectionVersion, 'structured selection version matches the fixture');
  } finally {
    await Promise.allSettled([clientTransport.close(), serverTransport.close()]);
  }
});

test('project_open rejects a non-string project_id with a stable tool-level error', { timeout: 5000 }, async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const server = new Server(
    { name: 'mcp-read-call-test-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(CallToolRequestSchema, createProjectOpenHandler());

  const client = new Client({ name: 'mcp-read-call-test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({ name: 'project_open', arguments: { project_id: 42 } });

    assert.equal(result.isError, true, 'malformed call is a tool-level error');
    assert.equal(result.content.length, 1, 'error has exactly one content item');
    assert.equal(result.content[0].type, 'text', 'error content is human-readable text');
    assert.match(result.content[0].text, /project_id/, 'error text names the malformed field');
    assert.match(result.content[0].text, /string/, 'error text names the expected type');
    assert.equal(result.structuredContent, undefined, 'error has no success structured content');
  } finally {
    await Promise.allSettled([clientTransport.close(), serverTransport.close()]);
  }
});
