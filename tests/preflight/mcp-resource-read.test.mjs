import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client';
import { Server } from '@modelcontextprotocol/sdk/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

const mainUri = 'ui://knowledge-workspace/main';

const stableMarker = 'KNOWLEDGE_WORKSPACE_UI_FIXTURE_MARKER';

const mainPageHtml =
  '<!doctype html>\n' +
  '<html lang="en">\n' +
  '<head><meta charset="utf-8"><title>Knowledge Workspace Main</title></head>\n' +
  '<body>\n' +
  '<p>Knowledge Workspace main page fixture.</p>\n' +
  '<span data-fixture="stable-marker">' + stableMarker + '</span>\n' +
  '</body>\n' +
  '</html>\n';

function createResourceReadHandler() {
  return async (request) => {
    if (request.params.uri !== mainUri) {
      throw new Error('Unknown resource: ' + request.params.uri);
    }

    return {
      contents: [
        {
          uri: mainUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: mainPageHtml
        }
      ]
    };
  };
}

test('resources/read returns the main page with the pinned MCP Apps 1.7.5 MIME profile for the exact ui:// URI', { timeout: 5000 }, async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const server = new Server(
    { name: 'mcp-resource-read-test-server', version: '1.0.0' },
    { capabilities: { resources: {} } }
  );

  server.setRequestHandler(ReadResourceRequestSchema, createResourceReadHandler());

  const client = new Client({ name: 'mcp-resource-read-test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.readResource({ uri: mainUri });

    assert.equal(result.contents.length, 1, 'response has exactly one content item');
    assert.equal(result.contents[0].uri, mainUri, 'content item matches the requested URI');
    assert.equal(result.contents[0].mimeType, 'text/html;profile=mcp-app', 'content item uses the pinned MCP Apps 1.7.5 resource MIME literal');
    assert.match(result.contents[0].text, /<!doctype html>/, 'text is an HTML document');
    assert.ok(result.contents[0].text.includes(stableMarker), 'text includes the stable fixture marker');
  } finally {
    await Promise.allSettled([clientTransport.close(), serverTransport.close()]);
  }
});

test('workspace_show advertises the pinned Apps resource URI', { timeout: 5000 }, async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = new McpServer({ name: 'mcp-apps-metadata-fixture', version: '1.0.0' });
  const client = new Client({ name: 'mcp-apps-metadata-client', version: '1.0.0' });

  registerAppTool(server, 'workspace_show', { _meta: { ui: { resourceUri: mainUri } } },
    async () => ({ content: [{ type: 'text', text: 'Workspace fixture' }] }));

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    const workspaceTool = tools.find((tool) => tool.name === 'workspace_show');
    assert.equal(workspaceTool?._meta?.ui?.resourceUri, mainUri);
  } finally {
    await Promise.allSettled([client.close(), server.close()]);
  }
});
