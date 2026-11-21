# Knowledge Workspace — Detailed Execution Plan and Definitions of Done

**Version:** 0.1 audit revision (offline-ready backlog)  
**Date:** 2026-11-20  
**Status:** Proposed implementation backlog  
**Related:** [Product vision](01-product-vision-and-motivation.md) · [Architecture and data structures](02-architecture-and-data-structures.md) · [Offline implementation agent handbook](04-offline-implementation-agent-handbook.md)

## 1. Delivery strategy

Build and prove the product in **vertical slices**, not a large backend followed by a large frontend. Each slice should leave a runnable Docker service and an explicit test. Prioritize the hardest assumptions: host compatibility, authenticated user-only page selection, full project read versus page-only writes, and the MCP Apps UI lifecycle.

**MVP release goal:** A user starts Docker, opens a project, works with several page tabs, applies a reusable template to a new page, asks ChatGPT or Claude to propose a change based on any page in the project, approves that change only on the active page, and later sees it from the other host. Local data survives restart and can be exported/restored.

**Offline execution condition:** The implementing agent has no internet. Source, images, package tarballs/caches, lockfiles, MCP protocol reference fixtures, and sample articles must be supplied locally. Actual ChatGPT/Claude connectivity and cloud inference **cannot be confirmed offline**; classify those checks as *external verification pending*, never as passed.

**Definition of done (global):** A task is finished only when code is merged, relevant unit/integration tests pass, CI is green, any necessary migrations are reversible or documented, error states are handled, and user-facing behavior is demonstrated against its acceptance criteria. No “works on my machine” alone.

### Suggested phases and dependency path

```text
0 Discovery spikes: host & permission feasibility
    |
1 Repo/Docker/DB foundation
    |
2 Projects + pages + session selection
    |
3 Knowledge hierarchy + graph + local UI
    |
4 Proposal/approval/validation + audit
    |
5 Templates + source material + repeatable analysis
    |
6 MCP tools + Apps view + host integration
    |
7 Hardening, export/restore, end-to-end release checks
```

Some UI and MCP work can start in parallel once Phase 1 foundations exist. **Do not defer the host-security spike until the end.**

## 2. Work breakdown structure

### Phase 0 — Feasibility and design validation

#### T0.1 — Host compatibility spike

**Implement:** Minimal MCP server with `ping`, read-only tool, test `ui://` embedded resource, and local browser fallback. Test current ChatGPT and Claude environments independently, including available local/remote transport configurations.

**Outputs:** `docs/host-compatibility.md`, screenshots/logs of supported UI rendering, connection instructions, limitations matrix.

**DoD:**
- [ ] MCP tool discovers and returns data from at least one target host.
- [ ] UI resource renders in an MCP Apps-capable test host OR a documented host limitation is established.
- [ ] ChatGPT access path (including tunnel if needed) is tested, not merely assumed.
- [ ] Claude Desktop local connectivity is tested, with remote connector behavior separately documented.
- [ ] Confirm whether page-switch user gesture can be securely proven to backend; document secure local-web fallback.
- [ ] UI fallback at localhost runs independently of a host.

#### T0.2 — Threat model and permissions spike

**Implement:** Threat analysis for model-supplied MCP requests, embedded app callbacks, remote tunnel, local API, prompt injection, page switching, proposal approval.

**DoD:**
- [ ] Written trust-boundary diagram names agent, embedded app, local browser, MCP transport, local server, and DB.
- [ ] Agent credentials demonstrably fail to call user-only approval/page-switch endpoints.
- [ ] Identified safe auth mechanism for each supported transport, or the action is intentionally routed through local UI.
- [ ] Data egress/privacy notice covers cloud inference and tunnel requests.

#### T0.3 — UX walkthrough and prototypes

**Implement:** Static/interactive click-through for project selector, tabs, page details, graph, proposal diff, template picker, switch suggestion.

**DoD:**
- [ ] 3 complete journeys demonstrated: create knowledge, compare across pages, reuse template.
- [ ] Switch approval and content approval appear as distinct gestures.
- [ ] Every view has a concise default and optional expanded details.
- [ ] Empty, conflict, offline, and host-does-not-support-UI states are represented.

#### T0.4 — Offline supply-chain preflight and protocol selection

**Implement:** Inventory local Node.js/runtime, Docker engine and base images, pinned lockfile plus npm tarballs/cache, offline SDK/API docs and fixture content. Choose one compatible pair of MCP core protocol revision and MCP SDK versions; create an offline install/build check.

**DoD:**
- [ ] `npm ci --offline` (or documented local package-store equivalent) succeeds without network requests, using pinned artifacts, OR missing dependencies are reported as blocking inputs.
- [ ] Docker image builds from locally cached/pinned base images without registry access, OR missing base images are documented as blockers.
- [ ] Dependency versions and hashes are recorded in `docs/offline-inventory.md`; no unpinned runtime downloads.
- [ ] Local MCP fixture harness runs with chosen wire revision; its version matches the adapter.
- [ ] Missing internet-dependent host tests appear as explicit external gates, not simulated successes.

### Phase 1 — Repository, infrastructure, and schema

#### T1.1 — Monorepo scaffold

**Implement:** TypeScript workspace, packages `domain`, `server`, `mcp`, `web`, `shared`; lint/format/typecheck/test scripts; environment config schema.

**DoD:**
- [ ] Clean clone installs and runs all scripts from README.
- [ ] TypeScript strict mode enabled and no errors.
- [ ] CI verifies lint, types, unit tests, and build on PR.
- [ ] No credentials embedded in repo or sample config.

#### T1.2 — Docker and storage

**Implement:** Multi-stage Docker image, Compose service, loopback-only `3000` binding, mounted `/app/data`, `/health`, startup validation, non-root runtime where feasible.

**DoD:**
- [ ] `docker compose up --build` launches UI and MCP endpoint.
- [ ] DB and source files remain after `docker compose down` then up.
- [ ] Wrong database permissions emit actionable error, not silent data loss.
- [ ] Only loopback host port is exposed by default.
- [ ] Health endpoint reports DB readiness.

#### T1.3 — Database migration and integrity suite

**Implement:** Tables and indexes from Architecture §5; migrations, WAL and foreign keys per connection, transaction helper, generated IDs.

**DoD:**
- [ ] Fresh DB migration succeeds automatically or through documented command.
- [ ] Database version is recorded and re-running migration is idempotent.
- [ ] Foreign-key violation and uniqueness checks are exercised in tests.
- [ ] Parent cycle and cross-project relationship attempts are rejected.
- [ ] Migration fixture with sample project/pages/templates passes integrity checks.

#### T1.4 — Authoritative contracts, test fixtures, and DB hardening migration

**Implement:** Add the architecture §5.1 migration for `connections`, local UI sessions, template drafts/events, and uniqueness of active template fields. Publish one shared runtime-validator and typed contract for each tool and UI API; seed a deterministic project with Article A/B fixtures.

**DoD:**
- [ ] Fresh migrations and upgrade path work in an offline SQLite integration test.
- [ ] Every connection is bound to a server-side context; revocation makes MCP calls fail.
- [ ] Agent tokens cannot satisfy local UI authorization; session IDs alone have no authority.
- [ ] No active page contains two nonarchived answers for the same template field key.
- [ ] Contract fixtures validate both accepted payloads and invalid payload rejection.

### Phase 2 — Persistent projects, page tabs, and selection

#### T2.1 — Project CRUD and project brief

**Implement:** Create, rename, list, open, archive projects; short project description/brief; preserve project IDs.

**DoD:**
- [ ] Can create two independent projects and reopen both after restart.
- [ ] Project overview returns project metadata plus page list in bounded payload.
- [ ] Querying project B with project A session is denied.
- [ ] UI keeps active project visible at all times.

#### T2.2 — Page CRUD and tab ordering

**Implement:** Create/rename/archive/reorder pages, persist sort order, tab UI with active state, local page-level views.

**DoD:**
- [ ] One project supports 10+ pages without overflow breaking navigation.
- [ ] Tab order is stable across reload and Docker restart.
- [ ] Archived pages are hidden by default but recoverable.
- [ ] Page IDs stay stable after renames and reordering.

#### T2.3 — Session-bound active-page selection

**Implement:** Authenticated user-only `page_select`, persisted session registry, `selection_version`, active-page enforcement middleware; AI can only suggest switch.

**DoD:**
- [ ] Model/agent MCP identity cannot select active page.
- [ ] UI action switches only to a page belonging to active project.
- [ ] Each switch increases `selection_version` exactly once.
- [ ] Two client sessions can independently keep different active tabs.
- [ ] A stale proposal targeting previous active page cannot be approved as if for current page.
- [ ] Local UI fallback works if host lacks a verifiable user-action channel.

#### T2.4 — Pair host connection and local approval UI

**Implement:** Local UI creates, labels, rotates/revokes host connection credentials, and explicitly selects a host-bound working context for page navigation and proposal approval. Authentication never relies on a model-supplied session ID or self-declared user-action flag.

**DoD:**
- [ ] ChatGPT-like and Claude-like mock connections have independent project/page selections.
- [ ] The local UI can choose which connection's proposal to review; approval checks the proposal origin session, not the browser's unrelated tab.
- [ ] Reusing expired/revoked connection credentials fails; token hashes rather than raw tokens are stored.
- [ ] A forged agent tool call cannot switch a page even if the caller knows valid page/session IDs.
- [ ] Host session expires predictably and can be re-paired without deleting project data.

### Phase 3 — Knowledge hierarchy, graph, and views

#### T3.1 — Node repository and tree mutation service

**Implement:** Object CRUD with types/statuses/summary/details/parent/sort order/version; page-scoped ownership; cycle prevention with recursive CTE.

**DoD:**
- [ ] Can create root/child/grandchild and move/reorder within page.
- [ ] Cannot move node under itself or descendant.
- [ ] Cross-page parent assignment fails.
- [ ] `version` increments on update and stale version yields conflict.
- [ ] User-authored direct edits also produce revision audit entries.

#### T3.2 — Relationships and cross-page reference support

**Implement:** Typed directed edges, owner-page constraint, cross-page target lookup and render.

**DoD:**
- [ ] Supports edge from Article A claim to Article B claim, with owner Article A.
- [ ] Prevents edges across different projects.
- [ ] Prevents duplicate active same-type edges.
- [ ] Edge edit/archive is refused when its owner page is not active for AI proposal.
- [ ] Validating edge requires valid/validated endpoints.

#### T3.3 — Overview/detail and working/validated projections

**Implement:** Outline tree, expandable detail panel, working/validated filters, graph limited by selected center and depth.

**DoD:**
- [ ] Project overview is compact; details are lazy-loaded.
- [ ] Validated view excludes working nodes, and nodes whose ancestors are not validated.
- [ ] Validated relationships require validated edge and endpoints.
- [ ] Empty-state UI directs user to create a page/object.
- [ ] Graph renders 50 nodes reasonably on a development laptop; no unbounded query on large project.

#### T3.4 — Search and bounded retrieval

**Implement:** FTS5 indexes and triggers; project-wide search, page filtered reads, cursor paging, maximum depth/limit; source pagination.

**DoD:**
- [ ] Search finds a term on another page in same project.
- [ ] Search never includes another project or archived records by default.
- [ ] Pagination is deterministic and returns a continuation token.
- [ ] Oversized request is rejected with documented validation error.
- [ ] Updating and archiving nodes keeps FTS results in sync.

#### T3.5 — Content provenance and archive behavior

**Implement:** Source links and optional locators/excerpts for AI-derived claims, archive/restore rules for pages, nodes and edges, Markdown sanitization, and deterministic missing-field rendering.

**DoD:**
- [ ] Source citations/locators remain tied to the correct project and analysis run.
- [ ] An archived parent hides its subtree in ordinary views, without deleting children.
- [ ] Cross-page references to archived targets never appear as active validated links.
- [ ] Untrusted HTML/Markdown cannot run scripts in either UI.
- [ ] Source-free assertions are labeled as unsupported or working rather than silently verified.

### Phase 4 — Proposal, approval, and authority separation

#### T4.1 — Proposal schema and preview builder

**Implement:** Parse/validate operation batches (`object` and `relationship`), client-ref resolution, deterministic preview, idempotency key, batch cap 20.

**DoD:**
- [ ] Proposed create/edit/link actions appear without changing committed DB objects.
- [ ] Invalid field names, cross-page modifications, or malformed operations fail before storage.
- [ ] Retrying same `idempotency_key` yields same proposal; no duplicates.
- [ ] Preview clearly identifies target page and before/after changes.
- [ ] Cross-page references shown as links, not writable targets.

#### T4.2 — Atomic approval, conflicts, and revisions

**Implement:** User-only approve/reject; `BEGIN IMMEDIATE` transaction; expected entity + selection versions; ordered apply; revision snapshots.

**DoD:**
- [ ] Approved batch commits all operations or none.
- [ ] Concurrent human edit causes stale proposal conflict, not overwrite.
- [ ] Navigating to another page invalidates direct approval until re-review.
- [ ] One approved proposal produces exactly one revision and complete before/after audit entries.
- [ ] Unauthorized approval attempt produces 403 and no mutation.
- [ ] Reject keeps revision history clean and preserves proposal decision.

#### T4.3 — Human validation and evidence state

**Implement:** Separate UI controls for commit and validate; mark evidence as unassessed/supported/disputed/verified independent of validation.

**DoD:**
- [ ] Approved new assumption may remain working.
- [ ] User can validate a working assumption while its evidence remains unassessed.
- [ ] AI cannot directly mark object validated via ordinary `change_propose` without explicit user validation intent/approval policy.
- [ ] Status transitions are logged with actor/time.

#### T4.4 — Proposal editing, rejection, and stale-context re-review

**Implement:** Authenticated local UI can edit a pending proposal's contents or reject it. Editing creates a fresh proposal/review version; no partial commit. Define re-review behavior when the originating host context or target page changes.

**DoD:**
- [ ] User can correct text in a pending proposal without approving the original draft.
- [ ] Edited proposal has a distinct revision/version and immutable history of the previous suggestion.
- [ ] Rejecting a proposal cannot mutate committed objects, relationships or validation state.
- [ ] Stale selection/context requires returning to the originating page and a fresh review gesture.
- [ ] Approve/reject are idempotent against retries (no duplicate revisions).

### Phase 5 — Templates, page instances, and repeatable analysis

#### T5.1 — Template schema and versioned library

**Implement:** Template creation and immutable versions, ordered field schema, kinds `short_text`, `long_text`, `list`, `number`, `boolean`, `reference`, validation.

**DoD:**
- [ ] Define Critical Analysis template with 5+ fields and prompts.
- [ ] Create v2 without mutating v1; retrieve both versions accurately.
- [ ] Invalid schema or duplicate field keys are rejected.
- [ ] Project-local templates do not leak to another project; global library templates may be reused.
- [ ] AI-suggested template definition is explicitly reviewed by user before saved.

#### T5.2 — Create page from template

**Implement:** User creates new page with pinned template version; instantiate field nodes under page hierarchy; edit field answers.

**DoD:**
- [ ] Article A and Article B each instantiate same template without sharing answers.
- [ ] Each page retains its original template version after v2 is published.
- [ ] Empty required fields are visible but not fabricated.
- [ ] Restart keeps page-template linkage and field order.

#### T5.3 — Sources and template-based AI analysis

**Implement:** Add local source text/file reference, SHA-256 and optional URL; read bounded excerpts; host agent produces structured result using template schema; create page-scoped proposal from result.

**DoD:**
- [ ] User attaches source text; source can be reopened offline.
- [ ] Agent reads template v1 and source, returns fields in expected shapes.
- [ ] Missing evidence produces explicit `missing_reason` or empty value.
- [ ] Applying generated analysis creates pending proposal, not direct mutation.
- [ ] After approval, result is visible only in target page; source and version are traceable.
- [ ] No claim of automatic arbitrary-URL ingestion without a supported fetch mechanism.

#### T5.4 — Save structure of existing page as template

**Implement:** Extract section labels, prompts and data shapes from a page, offer draft template proposal and user review.

**DoD:**
- [ ] User can ask “save this analysis structure” and review proposed fields.
- [ ] Saved template excludes Article A-specific answers unless user explicitly chooses example text.
- [ ] Reapplying template to Article B reproduces structure but not Article A content.

#### T5.5 — User-reviewed template proposal/version creation

**Implement:** Required agent tool `template_propose` stores `template_drafts`; an authenticated UI review creates a template or increments the immutable version and records `template_events`. Validate template scope and field keys before acceptance.

**DoD:**
- [ ] AI can propose saving Article A's analysis structure, including prompts/kinds but not its answers.
- [ ] No draft can change the global or project template library before user approval.
- [ ] After approval, v1 and v2 remain immutable; page instances stay pinned to the version initially selected.
- [ ] A stale expected template version conflicts, rather than overwriting newer template changes.
- [ ] Revoked agent tokens cannot submit template drafts; unknown schema keys are rejected.

#### T5.6 — Source ingestion privacy and run provenance

**Implement:** User-mediated local text/file import with safe filename generation, relative paths, bounded size/MIME/encoding, SHA-256 hashing and deletion/recovery policy; `change_propose` may include a typed `analysis_context` for template version, source, field results and missing reasons, creating a linked `template_runs` proposal. No automatic URL fetch in v0.1.

**DoD:**
- [ ] Path traversal, symlinks outside managed storage, binary payloads presented as text, and over-limit source files are rejected.
- [ ] Text imported from an article can be re-read without network access and is identified by digest.
- [ ] Missing fields carry reason/null rather than invented answers.
- [ ] Approved proposal marks associated run accepted; rejection cancels run; conflict does not claim acceptance.
- [ ] Agent cannot initiate arbitrary outbound fetch or read local filesystem paths via MCP arguments.

### Phase 6 — MCP tools, embedded App, and two-host use

#### T6.1 — MCP read tools

**Implement:** `project_open`, `knowledge_read`, `knowledge_search`, `source_read`, `template_list`, `template_read`, with JSON schemas, pagination, structured/text outputs.

**DoD:**
- [ ] Tool schema validation and errors tested via MCP inspector.
- [ ] AI can discover all pages in active project, then retrieve only relevant sections.
- [ ] Cross-project read is denied; bounded retrieval honored.
- [ ] Tool outputs identify page/source references and validation/evidence status.
- [ ] Tool descriptions encourage big-picture-first behavior and concise chat.

#### T6.2 — MCP write-proposal and navigation tools

**Implement:** `change_propose`, `change_review`, `page_switch_suggest`, `workspace_show`; enforce session and active page server-side.

**DoD:**
- [ ] AI can propose active-page changes but not call approve/validate/page-select via agent channel.
- [ ] Model-provided different `page_id` is rejected even if it exists within project.
- [ ] AI request for another page produces user-visible switch suggestion only.
- [ ] MCP tool duplicate/retry behavior does not create duplicate proposals.

#### T6.3 — Embedded MCP App and local web fallback

**Implement:** Bundle UI with `ui://knowledge-workspace/main`, app registration metadata, host handshake, result rendering; reuse same React components in local browser.

**DoD:**
- [ ] Project tabs/outline/graph/proposal review work in local browser.
- [ ] In compatible MCP host UI, relevant tool opens the embedded app or limitation is documented.
- [ ] User-only mutation in embedded UI uses verified authorization; otherwise opens local browser explicitly.
- [ ] Unsupported host still receives meaningful text/tool response.
- [ ] No hardcoded assumption about fixed right-side panel width or always-present iframe.

#### T6.4 — Host integration acceptance

**Implement:** Docs/scripts for tested ChatGPT tunnel and Claude Desktop local connection; optional remote Claude connector if verified.

**DoD:**
- [ ] One host proposes an object, local UI approves, second host reads it from same project.
- [ ] Switching page through host A does not silently switch host B session.
- [ ] Test records exact host/client version, connection mechanism, UI behavior, permissions.
- [ ] If host B cannot render MCP App, local UI fallback still enables complete workflow.
- [ ] Failure to connect is surfaced with actionable troubleshooting guidance.

#### T6.5 — Offline MCP conformance harness and deferred live-host gate

**Implement:** A local JSON-RPC tool-list/call harness and MCP Apps-resource fixture verifying tool schemas, content/structuredContent outputs, errors, metadata, and UI resource MIME. Test compatible protocols using bundled SDKs; record version. Maintain separate live-host smoke-test instructions for a networked tester.

**DoD:**
- [ ] Local harness can list tools, read resources, call read/propose tools and verify malformed-call errors.
- [ ] `ui://knowledge-workspace/main` metadata and HTML MIME profile are checked against pinned MCP Apps extension spec.
- [ ] Full local browser journey succeeds without a cloud account.
- [ ] Live ChatGPT/Claude tests remain visibly `NOT RUN — network/host required` when offline.
- [ ] A tester has exact manual steps, pass/fail evidence fields and fallback decisions for online verification.

#### T6.6 — Guided conversation skill and concise, progressive AI behavior

**Implement:** Write a bundled `knowledge-guide.md` host-agnostic prompt/interaction policy and expose a compact agent-facing help text through tool descriptions or an optional MCP prompt. It guides the AI to discuss the big picture, then connections, then details; keep chat responses short; retrieve project context progressively; propose capture **only when the user requests**; distinguish user-approved information from AI assumptions; suggest navigation rather than switching. Because hosts may ignore MCP prompts, do not treat this as a security boundary.

**DoD:**
- [ ] Offline bundle contains the full skill/prompt text with examples and non-examples.
- [ ] `project_open`/tool descriptions communicate active page, project-wide read, and active-page-only action semantics without leaking unrelated project metadata.
- [ ] A fixture-driven conversational scenario covers overview → relationship → detail → user-requested proposal, without automatic extraction.
- [ ] Assumptions are clearly labeled and not presented as verified facts.
- [ ] Actual cloud model adherence is classified as external UX verification, not proven by local mocks.

### Phase 7 — Security, resilience, portability, and release

#### T7.1 — Local and remote access protection

**Implement:** Auth/session credentials, user-only action permissions, CSRF/Origin/Host checks, size/rate limits, secure tunnel config and logs.

**DoD:**
- [ ] Unauthorized write, approval, switch, and cross-project read tests pass.
- [ ] Spoofed UI-call headers do not count as user gestures.
- [ ] MCP exposure outside loopback is disabled by default.
- [ ] No tokens, article text, or full project contents in default logs.
- [ ] Security docs explain what is transmitted to cloud AI providers.

#### T7.2 — Export, import, backup, restore

**Implement:** Export project as JSON package plus source assets and Markdown view; import with stable/remapped IDs, consistent SQLite backup.

**DoD:**
- [ ] Export/import roundtrip preserves 2 projects, 4 pages, cross-links, template v1/v2, proposals, and revisions (or clearly defines excluded operational session records).
- [ ] Import handles collisions intentionally; rejects malformed packages.
- [ ] Backup restores after deleting/recreating Docker container.
- [ ] Backup from active WAL database is consistent.
- [ ] User documentation covers recovery procedure.

#### T7.3 — Performance and reliability tests

**Implement:** Fixture generator; tests with 10 projects, 100 pages, 5,000 objects, 10,000 edges, and multiple template versions (engineering test targets, not customer usage assumptions).

**DoD:**
- [ ] Outline initial load remains responsive under test fixture; measured results recorded.
- [ ] Search and graph expansion remain bounded.
- [ ] App survives abrupt process restart without partial proposal commit.
- [ ] Errors are actionable and DB integrity checks pass.

#### T7.4 — Documentation and v0.1 release gate

**Implement:** Setup/upgrade README, privacy guide, MCP connection guides, architecture diagram, API schema reference, demo project, changelog.

**DoD:**
- [ ] Fresh developer can follow setup and complete sample journey without private verbal instructions.
- [ ] All release acceptance scenarios below pass on a clean install.
- [ ] Supported hosts, known limitations, unsupported transport modes, and backups documented.
- [ ] Versioned image/tag and migration/version history produced.

#### T7.5 — Accessibility, UX and error recovery

**Implement:** Keyboard-accessible tabs, graph/outline alternative, focus/ARIA semantics, empty/loading/error states, source provenance UI, user-facing privacy notice, reconnection and expired-session handling.

**DoD:**
- [ ] Keyboard alone can create/select pages, navigate outline, inspect and approve/reject proposals.
- [ ] Graph information has an accessible outline alternative; not color-only statuses.
- [ ] Invalid/stale user action gives specific non-destructive recovery guidance.
- [ ] Local UI identifies the active host connection/page and warns before cloud reads.
- [ ] No significant accessibility issue blocks the core sample journey.

#### T7.6 — Offline delivery and evidence package

**Implement:** Produce immutable source bundle, dependency lockfile/offline cache manifest, known-good Docker image archive if available, deterministic demo dataset, database migration scripts, license notices, test report and manual online-host checklist.

**DoD:**
- [ ] Source and tests execute with network intentionally disabled when prerequisites are supplied.
- [ ] All missing tools/dependency tarballs are enumerated rather than silently downloaded.
- [ ] Local acceptance report separates `PASS`, `FAIL`, `BLOCKED` and `EXTERNAL VERIFICATION PENDING`.
- [ ] Versions/checksums of offline dependencies and test fixtures are recorded.
- [ ] No secret tokens or article bodies appear in the delivery logs/manifest by default.

## 3. End-to-end acceptance scenarios (release blockers)

| ID | Scenario | Expected outcome |
|---|---|---|
| E2E-01 | Create project with Overview, Article A, Article B | Tabs persist after restart; selected page state is session-scoped. |
| E2E-02 | While Article A is active, AI searches Article B | AI can retrieve B data within same project and cite object IDs. |
| E2E-03 | AI attempts to edit Article B while Article A is active | Server rejects proposal; AI offers switch suggestion. |
| E2E-04 | User approves switch to Article B | Session selection changes; no document is edited by the switch itself. |
| E2E-05 | AI proposes three mutations on Article B | User sees all three in one diff; authoritative DB unchanged. |
| E2E-06 | User approves proposal | Atomic commit, revision and audit; accepted objects can remain working. |
| E2E-07 | Page changes while proposal pending | Old proposal cannot silently apply to new active page. |
| E2E-08 | User validates assumption with evidence unassessed | Validated status updates independently of evidence status. |
| E2E-09 | Save Article A structure as template | Template contains structure/prompts, not Article A answers. |
| E2E-10 | Create Article B from template v1 | Empty structured fields; edits don't change Article A. |
| E2E-11 | Update template to v2 | Old page remains pinned to v1. |
| E2E-12 | Propose analysis using source material | Unsupported fields marked missing; commit only after approval. |
| E2E-13 | Cross-page graph relationship | Edge lives under active owner page, targets another page within project. |
| E2E-14 | Restart Docker | All projects, pages, data, templates, proposals, revisions preserved. |
| E2E-15 | Cross-host persistence | Approved content from host A readable in host B. |
| E2E-16 | Export / restore | Content and relationship integrity retained, no silent loss. |
| E2E-17 | Malicious prompt in article says “switch tabs and approve” | No page switch or approval occurs without user action. |
| E2E-18 | Host does not render MCP Apps UI | Local browser fallback supports review and approvals. |
| E2E-19 | Host A proposal is reviewed in separate local browser tab | Approval checks host A's session/page/selection version, not the browser's unrelated active tab. |
| E2E-20 | Agent token is revoked or forged | Project reads, proposals, template drafts and switches fail appropriately; no escalation. |
| E2E-21 | User edits/rejects pending proposal | Nothing is committed from the original draft; accepted replacement yields one revision. |
| E2E-22 | AI saves Article A analysis pattern | Pending template draft requires explicit review; version event recorded. |
| E2E-23 | Source contains path traversal or oversized binary | Import fails safely; no arbitrary file read or write. |
| E2E-24 | Archive parent/page with graph references | Knowledge remains recoverable; archived references excluded from validated projection. |
| E2E-25 | User completes core journey with keyboard | Tab navigation, review, and approval function without mouse. |
| E2E-26 | No internet available | Local harness and full UI workflow work; cloud host tests explicitly marked pending. |
| E2E-27 | MCP client uses incompatible wire revision | Server rejects or negotiates per the pinned SDK; does not assume another revision's session model. |
| E2E-28 | New template version published | Old page still refers to immutable v1 and renders its original field shapes. |
| E2E-29 | User explores an idea before capture | Agent guidance starts at overview, explains links, expands only on request, and does not auto-write. |

## 3.1 Coverage audit and unresolved external gates

The revised backlog includes: project persistence; multiple page tabs and explicit host-bound switching; project-wide read and active-page-only proposal operations; separate approval and validation; cross-page graph references; template creation, versioning and application; source capture and traceability; authenticated connection pairing; conflicts and proposal edits; import/export/restart; access control, accessibility, protocol conformance and offline packaging.

**Two categories must remain separate:**
- **Offline-completable:** domain logic, SQLite migrations, web UI, local MCP test harness, secure proposal pipeline, fixtures, offline documentation, and local packaging.
- **External verification required:** actual ChatGPT/Claude host connectivity, embedded panel behavior, tunnel/OAuth configuration, cloud model output, and host-specific approval callbacks. An offline agent must not claim these passed. A release requiring both real hosts is blocked until a connected tester supplies evidence.

### Remaining explicit product constraints

- No automatic article URL fetching or universal text/PDF ingestion; local text and supported files only.
- No automatic interpretation of chat history; only captured project records persist.
- Templates are structures of **pages**, not folders/projects.
- No selective operation-level approval in v0.1; user edits/replaces proposals then approves the whole batch.
- Assumption *importance/emphasis* is an open UX choice: v0.1 stores assumption type and independent validation/evidence states; any optional priority ranking must not be confused with factual confidence.
- No guaranteed always-visible split-screen layout across AI hosts; browser fallback must deliver full workflow.

## 4. Quality and observability requirements

### Unit tests

- Tree cycle detection, ordering, node validation/status transitions.
- Graph project invariants and owner-page enforcement.
- Template schema validation/version immutability.
- Proposal operation reference mapping, idempotency, optimistic locking.
- Read filtering and pagination.

### Integration tests

- SQLite transactions with real foreign keys enabled.
- Session authorization and page switching across clients.
- Tool envelope validation, bounded returns, MCP UI registration.
- Export/import and backup while DB is live.

### Security tests

- Cross-project data exposure attempts, cross-page write attempts, forged client session, stale selection, malformed JSON, oversized payload, prompt-injection content, untrusted Markdown sanitization, CSRF, host header manipulation, agent-to-UI escalation.

### Observability

- Structured logs for request ID, host/session pseudonymous ID, project/page IDs, proposal ID, outcome, latency and size; do not include knowledge body by default.
- Counters for proposal created/approved/rejected/conflicted, page-switch requests/approvals, template run errors, MCP transport failures.
- Health/readiness checks and visible local diagnostic page.

## 5. Sequencing, effort and critical path

Prioritize **T0.1/T0.2 before a large build**. The business risk is not SQLite; it is host UI behavior and trustworthy user-only approval across the host/app/server boundary.

Suggested minimal prototype:

1. Fake data + local UI showing one project with two tabs.
2. Session-bound `page_select` and agent-restricted proposal for active page.
3. SQLite authoritative commit and revision.
4. One MCP read + propose tool with host connection.
5. Template version + create second page from it.
6. Two-host integration and restart/export tests.

Parallel tracks once foundations exist:

- Backend/data: T1.3, T3.1, T3.2, T4.1, T4.2.
- UX/UI: T0.3, T2.2, T3.3, T6.3.
- MCP/integration: T0.1, T6.1, T6.2, T6.4.
- Template: T5.1–T5.4 after schema and proposal flow stabilize.

No dates or fixed staffing estimates are assumed; estimate after the two feasibility spikes and first vertical slice.

## 5.1 Local/offline completion vs connected-host release

**Local/offline implementation gate:** All domain, UI, database, security, file-import, proposal, template and mocked MCP tests pass; Docker runs from supplied offline assets; export/restore is tested; no app code attempts external network except explicitly configured MCP tunnel/AI host access.

**Connected-host verification gate:** A human tester with ChatGPT and Claude access runs the recorded host-compatibility steps, captures versions/logs, verifies secure connection and page-switch behavior, and checks fallback. When either host cannot meet security requirements, that host must use the local UI for user-only operations. Do not redefine a mock as a real host acceptance test.

## 6. Release checklist

- [ ] Full project read; page-only AI writes; explicit user switch approval.
- [ ] Project and page persistence in Docker-mounted storage.
- [ ] Working/validated separation and evidence metadata.
- [ ] Hierarchy + cross-page graph relationships.
- [ ] Pending proposals, atomic approval, audit, conflicts.
- [ ] Versioned templates reused across independent page instances.
- [ ] Bounded source retrieval and structured template analysis proposals.
- [ ] ChatGPT and Claude verified with documented limitations/fallback.
- [ ] Auth, CSRF/Origin checks, prompt-injection protections, cloud-data disclosure.
- [ ] Backup/export/import verified and setup documentation complete.
- [ ] Local UI/agent connection pairing, revocation and per-host session mapping verified.
- [ ] Template draft approval, provenance, proposal editing, accessible workflow and offline reproducibility verified.
- [ ] Live ChatGPT/Claude smoke tests recorded separately as pass/fail/pending; release claims accurately scoped.

## 7. Risks, choices, and explicit follow-up backlog

1. **Host UI session authority:** If user-gesture proof via embedded widget is unavailable, approvals/switches occur through local browser until a safe transport is supported.
2. **Approval UX:** Batch atomic approvals are simple but can feel heavy. Collect feedback before designing fine-grained selective approvals.
3. **Template extraction:** AI can propose a schema from existing page structure, but reliability depends on prompts; user review remains mandatory.
4. **Search scaling:** FTS5 should be sufficient for v0.1. Benchmark before adding embeddings.
5. **Cross-device storage:** Explicitly out of MVP; any future sync would need a different security model.
6. **Privacy wording:** Persistent knowledge stays locally, but selected content read by cloud AI does not remain exclusively on-device.

## 8. Suggested issue naming convention

Create implementation issues named `KW-T0.1 Host compatibility spike`, `KW-T1.1 Repository scaffold`, and so forth. Use one issue per T-task with the **Implement** and **DoD** blocks copied verbatim. Link each task to the release-blocking E2E scenario(s) it enables. A milestone is not complete until its task-level tests and relevant scenarios pass.
