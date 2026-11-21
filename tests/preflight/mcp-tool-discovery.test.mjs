import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client';
import { Server } from '@modelcontextprotocol/sdk/server';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

test('tools/list advertises the planned project_open read tool', { timeout: 5000 }, async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const server = new Server(
    { name: 'mcp-tool-discovery-test-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'project_open',
        description: 'Fixture tool for offline discovery conformance; not a production catalog entry.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string' }
          }
        }
      }
    ]
  }));

  const client = new Client({ name: 'mcp-tool-discovery-test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const { tools } = await client.listTools();

    assert.equal(tools.length, 1, 'server advertises exactly one fixture tool');
    assert.equal(tools[0].name, 'project_open', 'advertised tool name matches the plan');
    assert.equal(tools[0].inputSchema.type, 'object', 'input schema is an object schema');
    assert.deepEqual(
      Object.keys(tools[0].inputSchema.properties).sort(),
      ['project_id'],
      'only the planned project_id input property is declared'
    );
    assert.deepEqual(tools[0].inputSchema.properties.project_id, { type: 'string' }, 'project_id is a string input');
    assert.ok(!('required' in tools[0].inputSchema), 'project_id is optional, so no required array is advertised');
  } finally {
    await Promise.allSettled([clientTransport.close(), serverTransport.close()]);
  }
});
