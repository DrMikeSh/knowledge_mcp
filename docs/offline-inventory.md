# Offline inventory (T0.4)

- Date: 2026-11-21
- Scope: Offline-only evidence inventory for T0.4 — `plan/03-execution-plan-and-definitions-of-done.md` L78–L87.
- Evidence standard: All probes are fresh runs executed in this session; exit codes are recorded. Denied or unavailable commands are reported as-is, never simulated.
- Companion: `docs/offline-blockers.md` — exact blockers and external gates.

## 1. Environment probes (fresh runs)

| Command | Observed output | Exit code |
|---|---|---|
| `node --version` | `v22.22.0` | 0 |
| `npm --version` | `10.9.4` | 0 |
| `npm config get cache` | `/home/mike/.npm` | 0 |
| `npm cache ls` | Lists `make-fetch-happen:request-cache:https://registry.npmjs.org/...` tarball entries (fastq, fd-slicer, fdir, fetch-blob, fflate, file-type, fill-range, finalhandler, …; full listing truncated at run time) | 0 |
| `docker --version` | `Docker version 29.1.3, build 29.1.3-0ubuntu3~24.04.2` | 0 |
| `sqlite3 --version` | `sqlite3: command not found` | 127 |
| `du -sh /home/mike/.npm/_cacache` | NOT RUN — denied by shell allowlist (two attempts) | n/a (blocked; see blockers B-8) |
| FTS5 probe via `node -e` (Node built-in `node:sqlite`) | NOT RUN — `Permission denied: shell` (recorded as-is; no bypass attempted) | n/a |
| FTS5 probe via `python3 -c` (Python stdlib `sqlite3`) | NOT RUN — `Permission denied: shell` (recorded as-is; no bypass attempted) | n/a |

## 2. Repository state (read-only inspection)

- Repo root contains no `package.json`, no `package-lock.json`, no `node_modules/`, no `Dockerfile`, no `src/`.
- Consequence: there is no lockfile to pin against and no project-local dependency tree. `npm ci --offline` has no target in this repo — see blocker B-1.
- Branch: `factory/t0-4-offline-preflight`. Round-0 `git status --short` and `git diff --stat` (separate runs; manager-confirmed) recorded **six pre-existing unstaged edits, not made by this agent**, in: `.opencode/agents/coder.md`, `.opencode/agents/factory-manager.md`, `.opencode/agents/reviewer.md`, `.opencode/skills/document-reviewed-work/SKILL.md`, `.opencode/skills/offline-preflight/SKILL.md`, `docs/factory-workflow.md`. The tree is therefore **not clean**; that Round-0 capture is the standing record. Re-check in this correction round was denied (`git status --short && echo --- && git diff --stat` → `Permission denied: shell`); no bypass attempted.

## 3. npm cache and package store

- Cache location: `/home/mike/.npm` (per `npm config get cache`).
- `npm cache ls` (exit 0) confirms the cache holds `registry.npmjs.org` tarball entries, including: fastq, fd-slicer, fdir, fetch-blob, fflate, file-type, fill-range, finalhandler (listing truncated at run time).
- Cache completeness: **UNVERIFIED**. Definitive fact: the repo has no manifest/lockfile, so there is no pinned dependency set against which cache completeness could be checked. Unproven: that the cache fully covers any future pinned set. Nothing here is asserted as a validated, complete store.
- Cache size: NOT MEASURED — `du` blocked by allowlist (blockers B-8). Existence and contents are evidenced above; the size is recorded as unmeasured, not inferred.
- Candidate integrity-hash records for packages of interest, read from `/home/mike/.npm/_cacache/index-v5` (`registry.npmjs.org` index rows). These are **candidate cache-index records**: they show the cache index references these package versions; they have NOT been validated as complete or correct artifacts (no lockfile exists to pin against — blockers B-1):

| Package | Version | Integrity (candidate cache-index record) |
|---|---|---|
| `@modelcontextprotocol/sdk` | 1.28.0 | `sha512-gmloF+i+flI8ouQK7MWW4mOwuMh4RePBuPFAEPC6+pdqyWOUMDOixb6qZ69owLJpz6XmyllCouc4t8YWO+E2Nw==` |
| `@modelcontextprotocol/sdk` | 1.27.1 | `sha512-sr6GbP+4edBwFndLbM60gf07z0FQ79gaExpnsjMGePXqFcSSb7t6iscpjk9DhFhwd+mTEQrzNafGP8/iGGFYaA==` |
| `react` | 19.2.4 | `sha512-9nfp2hYpCwOjAN+8TZFGhtWEwgvWHXqESH8qT89AT/lWklpLON22Lc8pEtnpsZz7VmawabSU0gCjnj8aC0euHQ==` |
| `vite` | 6.4.1 | `sha512-+Oxm7q9hDoLMyJOYfUYBuHQo+dkAloi33apOPP56pzj+vsdJDzr+j1NISE5pyaAuKL4A3UD34qd0lx5+kfKp2g==` |
| `zod` | 4.3.6 | `sha512-rftlrkhHZOcjDwkGlnUtZZkvaPHCsDATp4pGpuOOMDaTdDDXF91wuVDJoWoPsKX/3YPQ5fHuF3STjcYyKr+Qhg==` |

## 4. Docker

- CLI: Docker version 29.1.3 (exit 0) — present in the sandbox.
- Engine: `/var/run/docker.sock` is **not visible from this sandbox** → no engine reachable from here. `docker image ls` / build were NOT attempted (no registry access permitted; see blockers B-2).
- Base-image cache: NOT VERIFIABLE while the engine is unreachable from the sandbox. Whether an engine or a base-image cache exists on the host is unverified; this is scoped to the sandbox's visible environment, not a host-wide absence. Recorded as a blocker, not asserted as absent (blockers B-2).

## 5. SQLite

- `sqlite3` CLI: not installed (exit 127). **CLI absence alone is not a T1.3 blocker** — recorded as an environment note (blockers B-7).
- Node built-in `node:sqlite` (Node v22.22.0): readiness **UNVERIFIED** — FTS5 probe via `node -e` denied by the shell allowlist (`Permission denied: shell`; recorded as-is, no bypass attempted). Not ruled out.
- Python stdlib `sqlite3`: readiness **UNVERIFIED** — FTS5 probe via `python3 -c` denied by the shell allowlist (`Permission denied: shell`; recorded as-is, no bypass attempted). Not ruled out.
- Repo-local Node driver: no `node_modules/` in the repo, so no local driver test is possible (blockers B-1/B-7).
- Conclusion: whether any SQLite/FTS5-capable runtime path is available in this sandbox is unverified; T1.3 design work is not blocked on this (blockers B-7).

## 6. Browser runtime

- Playwright browser profile cache: presence recorded at `/home/mike/.cache/ms-playwright/mcp-chrome-bc6fbb5/` (**existence only** — browser version and readiness **unverified**; no version probe was run).
- No local app server exists yet (no `src/`); the readiness check "open `http://127.0.0.1:3000/app`" is not applicable at this stage.

## 7. MCP SDK references (local, read-only)

| Install location | SDK version |
|---|---|
| `/home/mike/.npm-global/lib/node_modules/mcporter/node_modules/@modelcontextprotocol/sdk` | 1.28.0 |
| `/home/mike/.npm-global/lib/node_modules/openclaw/node_modules/@modelcontextprotocol/sdk` | 1.27.1 |

Protocol revision evidence (read from local SDK source; no network used):

- Both SDKs: `LATEST_PROTOCOL_VERSION = "2025-11-25"` (type definitions).
- SDK 1.28.0: `SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07']`.
- SDK 1.27.1 (openclaw): `spec.types.d.ts` mentions `DRAFT-2026-v1` — marked `@internal`, auto-generated; not a canonical published revision.
- MCP Apps extension package: NOT FOUND in the searched locations (repo tree + `/home/mike/.npm-global` node_modules tree; command: glob `**/ext-apps/**` → 0 matches). **Scope limit:** this records absence only in those searched locations; no host-wide absence is claimed.
- Evidence provenance: all rows in this section are read-only reads of the local installs at the paths above; search scope was the repo tree and `/home/mike/.npm-global`; no host-wide enumeration was performed.

## 8. Candidate reference pair (handbook reference — NOT manager-approved or manager-selected)

- MCP core: **2025-11-25** — supported by both local SDK revisions (1.27.1 and 1.28.0).
- MCP Apps: **2026-01-26** — extension spec revision.
- Status: this pair is a handbook reference for a later connected reviewer (plan/04 B3 L85). It is **not** recorded as manager-approved or manager-selected.
- Constraint (plan/04 B3 L85, verbatim): "Do not mix wire semantics or SDK imports from the two revisions."
- Note: a core revision **2026-07-28** exists in the provenance list with materially different Streamable HTTP session semantics; it is NOT used in this pair.

## 9. `docs/protocol-baseline.md` — not created

No locally established, compatible, exact baseline exists to record: the repo has no manifest or lockfile and the MCP Apps extension is absent in the searched locations (plan/04 B3 L92). The decision and rationale are recorded in `docs/offline-blockers.md` (B-4). This inventory records only what was verified locally; it does not claim a frozen baseline.

## 10. Provenance URLs (not fetched)

Listed for provenance only, per plan/04 B3 L97–L100. None were fetched, in line with the offline constraint (B1 L73); the URLs are provenance for a later connected reviewer (B3 L95):

1. `https://modelcontextprotocol.io/specification/2025-11-25/basic/transports`
2. `https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/transports/streamable-http.mdx`
3. `https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx`
4. `https://apps.extensions.modelcontextprotocol.io/api/documents/overview.html`

## 11. Offline install/build checks — not executed

- `npm ci --offline --no-audit --no-fund`: no lockfile, so no target (blockers B-1).
- Docker build from cached/pinned base images: engine not reachable from the sandbox (blockers B-2).
- Local MCP fixture harness (DoD L86): blocked — no project dependencies, no fixtures, no ext-apps package in the searched locations (blockers B-3).
- No scaffold or build was performed as part of this task (docs-only scope; see blockers B-10).
