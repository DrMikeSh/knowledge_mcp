# Documentation

## Sections

- [Factory workflow](#factory-workflow)
- [Offline preflight](#offline-preflight)

## Factory workflow

- [Review, documentation, and push](factory-workflow.md) — How the manager records approved work and decides whether to publish it.

## Offline preflight

- [T0.4 offline inventory](offline-inventory.md) — Local runtime, cache and SDK evidence, with the limits of each probe.
- [T0.4 offline blockers](offline-blockers.md) — Missing inputs, tasks that can proceed offline, and connected-host gates.
- [Offline preflight follow-up](offline-preflight-follow-up.md) — Reviewed cache evidence, one T1.4 acceptance case, and the remaining execution and provisioning gates.

The inventory and blocker report passed independent review. The offline npm install, Docker build and MCP fixture harness did not run; SQLite FTS5 readiness is unverified. Supply the pinned inputs and rerun the blocked checks before claiming runtime readiness. ChatGPT and Claude remain **EXTERNAL VERIFICATION PENDING**. This checkpoint stays local at the user's request.
