# Documentation

## Sections

- [Factory workflow](#factory-workflow)
- [Offline preflight](#offline-preflight)

## Factory workflow

- [Review, documentation, and push](factory-workflow.md) — How the manager records approved work and decides whether to publish it.

## Offline preflight

- [T0.4 offline inventory](offline-inventory.md) — Local runtime, cache and SDK evidence, with the limits of each probe.
- [T0.4 offline blockers](offline-blockers.md) — Original preflight blockers and connected-host gates.
- [Offline preflight follow-up](offline-preflight-follow-up.md) — Earlier cache evidence, one T1.4 acceptance case, and provisioning gates.
- [B7.1 SQLite FTS5 smoke test](sqlite-fts5-smoke.md) — Verified in-memory Node SQLite check; migrations remain untested.
- [Offline npm dependency checkpoint](offline-npm-install.md) — Reviewed manifest and lockfile, clean offline install, and confirmed installed pins.
- [MCP protocol baseline](protocol-baseline.md) — Verified in-memory core negotiation and the installed SDK and Apps pins.
- [T1.1a preflight test scripts](preflight-test-scripts.md) — The checked root npm commands and their exact local coverage.
- [T1.1b offline TypeScript toolchain](offline-typescript-toolchain.md) — Exact dev pins, offline lock generation, clean install, and installed-version verification.
- [T1.1c–d offline workspace scaffold](offline-workspace-scaffold.md) — Strict typecheck, five offline workspace links, and the TypeScript emit smoke test.
- [T6.5a–c offline MCP tool fixtures](offline-mcp-tool-fixtures.md) — Fixture discovery, successful read call, and malformed-call error coverage.
- [T6.5e–f offline MCP resource fixture](offline-mcp-resource-fixture.md) — Resource URI, Apps MIME profile, and linked tool metadata coverage.

The full MCP harness, Apps handshake and rendering, and Docker build are not yet verified. ChatGPT and Claude remain **EXTERNAL VERIFICATION PENDING**.
