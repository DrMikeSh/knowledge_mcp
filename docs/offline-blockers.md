# T0.4 — Offline Blockers

**Status:** BLOCKERS — exact, evidence-backed list of missing inputs for the offline
T0.4 preflight. Per `plan/04` B1 L75: "If offline dependencies are missing, report exact
package/version, cache path and install error in `docs/offline-blockers.md`. Continue with
dependency-free domain/schema design if possible; never fake a successful build."
No blocker here is simulated; each cites the exact evidence, plan anchor, and the tasks it blocks.

**Reference pair (B3 L85, handbook reference — NOT manager-approved or manager-selected):**
MCP core **2025-11-25** + MCP Apps **2026-01-26**.

## B-1 — No package manifest or lockfile in repo; `npm ci --offline` not runnable

- **Evidence:** repo root has no `package.json`, no `package-lock.json`, no
  `node_modules`. DoD L83 requires "`npm ci --offline` (or documented local package-store
  equivalent) succeeds without network requests, using pinned artifacts, OR missing
  dependencies are reported as blocking inputs." The OR-branch is taken: this is the blocker.
- **B1 L54 readiness row (verbatim):** "Exact `package-lock.json` and npm cache/tarballs OR
  equivalent fully populated package store" → test `npm ci --offline`. Neither artifact exists.
- **Blocks:** T1.1 runtime/install (DoD L96) and other dependency-dependent runtime work.
  NOT T1.3/T1.4 dependency-free design — that proceeds (see task-readiness section below).
- **Needed input:** an established `package.json` + `package-lock.json` plus a fully populated
  npm cache or tarball set, obtainable by a connected reviewer; the offline agent must not run
  network-backed `npm install` (B1 L73).

## B-2 — Docker engine unreachable from the sandbox; base-image cache NOT VERIFIABLE

- **Evidence:** `docker --version` → 29.1.3 (exit 0) so the CLI is present, but
  `/var/run/docker.sock` is **not visible from this sandbox** → no engine reachable from here.
  `docker pull` is prohibited offline (B1 L73). DoD L84: "Docker image builds from locally
  cached/pinned base images without registry access, OR missing base images are documented as
  blockers." OR-branch taken.
- **B1 L55 readiness row (verbatim):** "Cached Docker base images or `docker save` archive …
  `docker image inspect ...` and `docker load -i ...` as needed". Base-image cache is
  **NOT VERIFIABLE** while the engine is unreachable from the sandbox.
- **Scope limit:** whether an engine or a base-image cache exists on the host is unverified;
  this is scoped to the sandbox's visible environment, not a host-wide absence (inventory §4).
- **Blocks:** T1.2 (DoD L106) and the Docker-dependent portions of T6.5/T7.6.

## B-3 — DoD L86 local MCP fixture harness BLOCKED

- **Evidence:** "Local MCP fixture harness runs with chosen wire revision; its version matches
  the adapter." No project dependencies are installed (B-1), no fixture content exists in the
  repo, and the MCP Apps extension package (2026-01-26) is NOT FOUND in the searched locations
  (repo tree + `/home/mike/.npm-global` node_modules tree; glob `**/ext-apps/**` → 0 matches;
  scope limit: no host-wide absence claimed).
- **Blocks:** T6.5 (harness + host integration); adapter-version pinning in T6.x until
  B-1/B-4 are resolved.

## B-4 — No locally established compatible exact baseline → `docs/protocol-baseline.md` NOT created

- **Evidence:** B3 L89–90: the baseline doc is created when a compatible exact baseline is
  "available and compatible"; L92 is the record-versions instruction. Neither a pinned
  manifest/lockfile nor the MCP Apps extension package (NOT FOUND in the searched locations)
  exists locally, so no locally established compatible exact baseline exists.
- **Consequence:** `docs/protocol-baseline.md` is deliberately not created (per assignment);
  the candidate reference pair (2025-11-25 + 2026-01-26; handbook reference — NOT
  manager-approved or manager-selected) is recorded in `docs/offline-inventory.md` instead,
  pending a connected reviewer establishing the exact baseline.
- **Blocks:** T6.1–T6.4 (protocol-locked adapter work) until the baseline is locked; M L807:
  "Record pinned MCP SDK/core/Apps extension versions and fixture format; do not improvise the
  newer transport behavior from memory."

## B-5 — ChatGPT host: EXTERNAL VERIFICATION PENDING

- **Evidence:** plan/04 B2 L81 (verbatim): "The offline agent must mark these
  `EXTERNAL VERIFICATION PENDING`, not `PASS`." M L815 confirms the host gate. This is
  intentionally unverified offline — not simulated, not passed.
- **Blocks:** the ChatGPT host-verification gate for T6.4.

## B-6 — Claude host: EXTERNAL VERIFICATION PENDING

- **Evidence:** same rule as B-5 (B2 L81; M L815). Marked separately and never simulated.
- **Blocks:** the Claude host-verification gate for T6.4.

## B-7 — SQLite/FTS5 driver readiness UNVERIFIED (probes denied)

- **Evidence:** `sqlite3 --version` → exit 127 (command not found) — environment note;
  **CLI absence alone is not a T1.3 blocker**. Readiness of both runtime paths is **UNVERIFIED**:
  the two FTS5 probes were denied by the shell allowlist and are reported as-is, never
  simulated, with no bypass attempted:
  - FTS5 probe via `node -e` (Node built-in `node:sqlite`, v22.22.0): `Permission denied: shell`.
    Not ruled out.
  - FTS5 probe via `python3 -c` (Python stdlib `sqlite3`): `Permission denied: shell`.
    Not ruled out.
  - Repo-local Node driver: no `node_modules/` in the repo (B-1), so no local driver test is
    possible.
- **Blocks:** T1.4 offline SQLite integration test runtime (DoD L128) only, until a
  SQLite/FTS5-capable runtime path is verified. NOT T1.3/T1.4 dependency-free design — that
  proceeds (see task-readiness section below).

## B-8 — npm cache size unmeasured (probe denied)

- **Evidence:** `du -sh /home/mike/.npm/_cacache` denied by the shell allowlist (twice). The
  allowlist is exact-match; no `cat >` or other bypass was attempted (per assignment rules).
  Cache existence and contents are nonetheless evidenced by `npm config get cache` →
  `/home/mike/.npm` (exit 0) and `npm cache ls` (exit 0) listing `registry.npmjs.org` tarball
  entries.
- **Impact:** minor — size is recorded as unmeasured, not as a size value; nothing is inferred.

## B-9 — Provenance URLs are references only (not fetched)

- **Evidence:** B3 L95 (verbatim): URLs are "provenance for a later connected reviewer, not
  instructions for the offline agent to fetch them". B3 L97–100 lists the four URLs. None were
  fetched by the offline agent.
- **Impact:** not a defect; recorded so reviewers do not treat URL presence as verified
  access.

## B-10 — No scaffold or build executed (offline-only scope)

- **Evidence:** assignment scope is docs-only; B1 L73 prohibits network-backed `npx`/`npm
  install`/`docker pull`; no scaffold/build was run, and per B1 L75 the offline agent "never
  fake[s] a successful build."
- **Impact:** any PASS label for build/scaffold would be false; none is claimed.

## Task readiness (what can and cannot start from the local specification)

Per `offline-preflight` step 4 — pause work that depends on missing inputs and identify the
plan tasks that can proceed:

**Can proceed (dependency-free):**

- **T0.1/T0.2/T0.3** — design/diagram/walkthrough work proceeds against the readable `plan/`
  docs, without network or dependencies.
- **T1.3/T1.4 dependency-free schema/contract design** (B1 L75: "Continue with dependency-free
  domain/schema design if possible") proceeds against the readable plan docs.

**Cannot start (runtime-dependent implementation only):**

- T1.1 runtime/install (DoD L96) — awaits B-1 (lockfile + populated cache).
- T1.2 (DoD L106) — awaits B-2 (Docker engine/base images, from the sandbox's view).
- T1.4 offline SQLite integration test runtime (DoD L128) — awaits B-7 (verified driver path).
- T6.1–T6.4 (protocol-locked adapter work) — awaits B-4 (locked baseline).
- T6.4 host gates (ChatGPT, Claude) — awaits B-5/B-6 (`EXTERNAL VERIFICATION PENDING`).
- T6.5 (fixture harness + host integration) — awaits B-3, plus B-1/B-4.
