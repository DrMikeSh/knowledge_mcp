# MCP protocol baseline

**Manager decision: B3.1b approved for in-memory core initialization.** The checkpoint remains local at the user's request.

| Component | Pin | Evidence |
|---|---|---|
| MCP core | `2025-11-25` | Verified in the SDK initialization response. |
| TypeScript SDK | `@modelcontextprotocol/sdk@1.29.0` | [Reviewed lockfile and offline install](offline-npm-install.md). |
| MCP Apps | `@modelcontextprotocol/ext-apps@1.7.5` | Installed offline; its bundled README identifies `2026-01-26` as stable. Apps behavior against that revision has not been tested. |

The coder ran `node --test tests/preflight/mcp-negotiation.test.mjs` inside OpenCode: exit 0, one passed, zero failed or skipped. The reviewer inspected the test and accepted the coder's TAP evidence without an independent rerun. The fixture links a client and server in memory, captures the JSON-RPC `initialize` response for the matching request ID, and asserts the exact core revision. The SDK's internal draft types are not the baseline.

This covers one part of T0.4 and T6.5. It does not verify a production adapter, an HTTP or stdio transport, tool or resource calls, Apps rendering, or the full conformance harness. Live ChatGPT and Claude checks remain **EXTERNAL VERIFICATION PENDING**.
