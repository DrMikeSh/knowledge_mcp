# B7.1 — In-memory Node SQLite FTS5 smoke test

**Manager decision: approved.** This closes the B-7 preflight check for the built-in `node:sqlite` path. It supersedes the B7.1 execution blocker in the [earlier follow-up](offline-preflight-follow-up.md).

The coder ran `node --test tests/preflight/sqlite-fts5.test.mjs` inside OpenCode: exit 0, one passed, zero failed or skipped. Node emitted a non-fatal experimental SQLite warning. The independent reviewer inspected the test and accepted the coder's TAP evidence; the reviewer could not rerun it under the reviewer shell policy.

The test creates an in-memory FTS5 table, inserts one row, checks that a bound `MATCH` query returns it, and closes the database. It does not select or verify the application driver, test file-backed persistence, or exercise T1.4 migrations or upgrades. This checkpoint stays local at the user's request.
