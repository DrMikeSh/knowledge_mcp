import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client';
import { Server } from '@modelcontextprotocol/sdk/server';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

test('MCP initialize handshake negotiates the latest protocol version', { timeout: 5000 }, async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  let initializeRequestId;
  let initializeResponse;

  // Capture the initialize request as it leaves the client transport.
  const originalClientSend = clientTransport.send.bind(clientTransport);
  clientTransport.send = (message, options) => {
    if (message.method === 'initialize' && message.id !== undefined) {
      initializeRequestId = message.id;
    }
    return originalClientSend(message, options);
  };

  // Capture the ordinary JSON-RPC response as it leaves the server transport.
  const originalServerSend = serverTransport.send.bind(serverTransport);
  serverTransport.send = (message, options) => {
    if (
      initializeRequestId !== undefined &&
      message.id === initializeRequestId &&
      message.method === undefined &&
      message.result !== undefined
    ) {
      initializeResponse = message;
    }
    return originalServerSend(message, options);
  };

  const server = new Server({ name: 'mcp-negotiation-test-server', version: '1.0.0' });
  const client = new Client({ name: 'mcp-negotiation-test-client', version: '1.0.0' });

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    assert.ok(initializeResponse, 'captured the initialize response on the wire');
    assert.equal(initializeResponse.jsonrpc, '2.0', 'initialize response is a JSON-RPC 2.0 message');
    assert.equal(initializeResponse.id, initializeRequestId, 'response id matches the initialize request id');
    assert.equal(initializeResponse.result.protocolVersion, '2025-11-25', 'server confirms the latest protocol version');
    assert.ok(!('type' in initializeResponse), 'wire message is plain JSON-RPC with no SDK wrapper field');
  } finally {
    await Promise.allSettled([clientTransport.close(), serverTransport.close()]);
  }
});
