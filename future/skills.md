# Future factory skills

| When | Proposed skill or reference | What it would help verify |
| --- | --- | --- |
| T6.3, once the local React UI and MCP tools exist | Adapt the official [MCP Apps `add-app-to-server` skill](https://github.com/modelcontextprotocol/ext-apps/blob/main/plugins/mcp-apps/skills/add-app-to-server/SKILL.md) to the pinned local SDK and extension version. | Register the UI resource and metadata, reuse the browser view, and check the unsupported-host fallback with local fixtures. |
| OFF-20 and T7.5, once the local browser runner is available | Add a short UI verification skill using the pinned [Playwright accessibility guidance](https://playwright.dev/docs/accessibility-testing). | Exercise keyboard tab navigation, proposal approval focus, and the outline fallback on a deterministic fixture. |
| T6.6, when the host-facing guidance is built | Produce `docs/knowledge-guide.md` from the [guided conversation task](../plan/03-execution-plan-and-definitions-of-done.md#t66--guided-conversation-skill-and-concise-progressive-ai-behavior). | Check overview-first retrieval, explicit capture requests, and suggested page switches with local fixtures. Record actual host behavior during connected acceptance. |

Review and pin any third-party instructions and references before adding them
to `.opencode/skills/`. The local coder and reviewer use only the resulting
local files during implementation. The manager coordinates and handles
escalations through OpenAI.
