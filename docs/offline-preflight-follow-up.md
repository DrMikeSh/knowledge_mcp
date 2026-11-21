# Offline preflight follow-up

This checkpoint follows the [T0.4 inventory](offline-inventory.md) and [blocker report](offline-blockers.md) at `0cfe562`. It stays local and does not establish runtime readiness.

## Reviewed evidence

- **B1.1a — MCP Apps cache:** `npm cache ls @modelcontextprotocol/ext-apps` ran in the factory and returned no entries; the tool did not expose a numeric exit status. Independent review passed for this observation only. No exact installable Apps release, cache integrity, or SDK compatibility was established.
- **T1.4-D1 — active field-answer uniqueness:** Independent design review passed after correcting the fixture statuses. The case covers the partial unique index in [architecture §5.1](../plan/02-architecture-and-data-structures.md#51-required-hardening-migration-and-hostui-pairing) and the T1.4 uniqueness criterion. No migration or SQLite test ran.

### Future T1.4 acceptance case

Seed active project `proj-001` and active page `page-001` in that project. Use valid required fields, fixed timestamps and schema defaults; leave both page template references and both answer parents null. Insert `ko-0001`, a `working` `field_answer` for key `author` on that page. Separately insert `ko-0002`, a `validated` `field_answer` with the same project, page and key. Expect the second insert to fail on the partial unique key `(page_id, template_field_key)`, without asserting a driver-specific error code. Confirm the first row is unchanged and the second is absent. Both inputs qualify for the index; a qualifying answer on a different page has a different index key.

## Remaining gates

- **B7.1 — SQLite FTS5:** The Node built-in `node:sqlite` test passed static review. The factory denied `node --test tests/preflight/sqlite-fts5.test.mjs` with `Permission denied: shell`. The test stays outside the commit. Rerun that exact command in the factory once it is narrowly authorized, without widening access to general Node commands or changing sandbox isolation. A pass would verify only this Node runtime path, not app-driver selection or migration/upgrade behavior.
- **B1.1b / B-1 / B-4 — packages and protocol:** Provision a trusted exact `@modelcontextprotocol/ext-apps` tarball with registry provenance and integrity, package metadata (including SDK peer range and Node requirements), and evidence for Apps `2026-01-26`. Compare it against SDK `1.27.1` and `1.28.0` for candidate core `2025-11-25`. Supply the pinned transitive closure in the offline cache before clean-install verification. No `docs/protocol-baseline.md` has been created.
- **B-3 / T6.5 — MCP harness:** Await the pinned runtime and fixture inputs before negotiation, tool and resource checks. ChatGPT and Claude are **EXTERNAL VERIFICATION PENDING** (not run; network and host required).
- **B-2 / T1.2 — Docker:** Await a Dockerfile with exact base-image pins and a trusted runner that can confirm the pinned images and run an offline build. Do not expose the Docker socket inside the factory.
