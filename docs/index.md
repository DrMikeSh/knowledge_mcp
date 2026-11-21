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

The full MCP harness, Apps behavior, and Docker build are not yet verified. ChatGPT and Claude remain **EXTERNAL VERIFICATION PENDING**.
