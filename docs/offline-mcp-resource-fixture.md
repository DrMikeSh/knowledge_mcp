# Offline MCP resource fixture (T6.5e, f1, f2)

Approved in the factory with MCP SDK `1.29.0` and MCP Apps SDK `1.7.5`:

- `resources/read` returns static fixture HTML for `ui://knowledge-workspace/main` with the exact MIME profile `text/html;profile=mcp-app`.
- `tools/list` returns fixture `workspace_show` metadata with `_meta.ui.resourceUri` pointing to the same URI. Tool visibility metadata was not checked.

The coder ran `npm run test:mcp` (6 passed) and `npm test` (7 passed) separately. Independent review checked both fixture assertions and accepted the test evidence.

The tests use linked in-memory transports and do not verify the production adapter, Apps handshake or rendering, or the browser journey. The proposal fixture still needs its reviewed contract. Docker verification belongs to a trusted runner. Live ChatGPT and Claude checks are **EXTERNAL VERIFICATION PENDING** (not run; network and host required).

Publication is planned to the matching factory branch only; no merge or update to `main`.
