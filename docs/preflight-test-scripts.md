# Preflight test scripts (T1.1a)

The root manifest now exposes the existing preflight tests without changing dependency pins or the lockfile. The coder ran both commands separately in the factory:

| Command | Result | Coverage |
|---|---|---|
| `npm test` | Exit 0; 2 passed | In-memory SQLite FTS5 and in-memory MCP initialization |
| `npm run test:mcp` | Exit 0; 1 passed | In-memory MCP initialization only |

The independent reviewer checked the manifest diff, the pre-existing worktree baseline, and the coder's run evidence. The manager approved T1.1a only. This does not verify the rest of the workspace scaffold, a production MCP adapter, or Docker. Live ChatGPT and Claude checks remain **EXTERNAL VERIFICATION PENDING**.

This checkpoint stays local at the user's request; no push or merge is planned.
