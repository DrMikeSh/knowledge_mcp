# Offline MCP tool fixtures (T6.5a–c)

Approved against the pinned MCP SDK (`1.29.0`) over linked in-memory transports:

- T6.5a: `tools/list` advertises one fixture `project_open` tool with an optional string `project_id`.
- T6.5b: A valid `project_open` call returns readable text and structured fixture data for a selected project, its brief, ordered pages, active page, and selection version.
- T6.5c: The fixture rejects a numeric `project_id` with a tool-level error that identifies the field and expected type, and omits the success payload.

The coder ran `npm run test:mcp` (4 passed) and `npm test` (5 passed) separately in the factory. The malformed test first failed on the missing error, then passed after fixture validation was added. Independent review approved all three leaves, including the valid-call assertions after the shared handler changed.

These fixtures do not verify production schemas, authorization, persistence, or the production adapter and transports. The write-proposal fixture awaits a reviewed proposal contract. Resource reads, Apps MIME and rendering, the full browser journey, and Docker are not verified by this checkpoint. Live ChatGPT and Claude checks are **EXTERNAL VERIFICATION PENDING** (not run; network and host required).

This checkpoint stays local at the user's request. No push or merge is planned.
