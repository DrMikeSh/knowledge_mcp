# Knowledge Workspace — Architecture, Data Structures, and MCP Contracts

**Version:** 0.1 draft  
**Date:** 2026-11-20  
**Status:** Implementation-oriented design; examples are proposals, not deployed software  
**Related:** [Product vision](01-product-vision-and-motivation.md) · [Execution plan](03-execution-plan-and-definitions-of-done.md)

## 1. Architecture at a glance

```text
ChatGPT / Claude (cloud reasoning)
  | MCP tools / UI embedding; transport differs by host
  v
Local Docker service (loopback-bound)
  +-- MCP adapter: tool and UI resource registration
  +-- Local web application: same project/page UI, host-independent fallback
  +-- Knowledge API + policy engine
  |    +-- Project/session read policies
  |    +-- Active-page targeting and switch approval
  |    +-- Proposal + approval transactions
  |    +-- Template definition / instantiation
  +-- SQLite (single source of truth)
  +-- Local source documents and export/backup directory
```

**Stack suggestion:** TypeScript/Node.js; official MCP TypeScript SDK; MCP Apps extension SDK; React + React Flow (graph) + simple outline; SQLite with Drizzle or parameterized SQL; Docker Compose. No vector database required for MVP.

**Important:** The same server may expose Streamable HTTP for suitable clients and an optional stdio bridge for local desktop clients. A remote host cannot simply reach `localhost` on the user's computer. ChatGPT may use its supported secure tunnel flow; Claude Desktop supports local integrations; Claude remote MCP connectors originate from Anthropic's cloud and may need an authenticated tunnel/public endpoint. Validate each in a test matrix instead of assuming identical behavior. MCP Apps define embedded `ui://` resources but do not guarantee a persistent panel layout in every host.

## 2. Permission and scoping model

### 2.1 Read versus write

- The model is authorized to **read all committed pages in the currently active project** through bounded read/search APIs. The validated and working layers are selectable; archived content is omitted by default.
- Agent writes **never directly mutate** authoritative project data. `change_propose` creates pending changes for exactly the **active page** of the corresponding authenticated session.
- An agent may suggest opening another page, but **cannot change active_page_id**.
- A page switch is committed only after **explicit user interaction** in the UI (or an equivalent authenticated user-only action).
- A page switch does not authorize edits. A subsequent proposal must be approved separately.
- Cross-page relationships may be proposed from the active page to objects on other pages; relationship ownership is assigned to the active page. Existing objects on other pages cannot be modified by that proposal.
- The active project itself is also user-selected; the agent cannot silently change the active project.
- A project-wide read privilege is a scoped capability, **not** permission to send unlimited records in a single response or to another project.

### 2.2 Session and identity

Persist content in the project, but bind UI selection to a **client session**:

```ts
interface ClientSession {
  id: string;
  clientKind: 'local_web' | 'chatgpt' | 'claude' | 'other';
  activeProjectId: string | null;
  activePageId: string | null;
  selectionVersion: number; // increment on switch
  expiresAt: string;
}
```

Session state can be stored server-side in SQLite, or signed short-lived session state backed by a registry. **Never trust a model-provided `active_page_id` as authority.** Agent tools derive target page from their credential/session. UI `page_select` must increment `selectionVersion` using an authorized user-initiated call. On proposal creation record the page ID and expected selection version. On approval verify both still match (or require explicit re-targeting).

**Crucial integration condition:** A trusted UI user gesture and a distinct agent channel must be distinguishable at the server. MCP Apps supports app-only visibility metadata, but tool visibility on its own is **not** sufficient authorization. The implementation must validate connection identity, permission, request origin/capability, and user session. For a host that cannot meet this requirement, **open the authenticated local web UI for approvals**; do not lower the security bar.

## 3. Domain objects

### 3.1 Project (folder)

Durable unit of knowledge and access scope. Has many pages and relationships. Rename old `workspace` terminology in UI; choose `projects` as the actual database table for fresh v0.1 (or migrate old `workspaces` if existing code exists). **No separate workspace table** needed.

### 3.2 Page (tab)

Belongs to exactly one project; has title, ordering, optional template + pinned version, status, revision counter. Contains a tree of knowledge objects. One project can have many pages, with page-scoped editing.

### 3.3 Knowledge object (tree node)

Belongs to exactly one page and project. Parent can be null or a node on the **same page**. Types: `concept`, `requirement`, `decision`, `assumption`, `question`, `field_answer`. A `field_answer` may have `template_field_key` and a data payload. Keep `summary` short for overview and `details` as Markdown. `validation_status`: `working | validated | archived`. `evidence_status`: `unassessed | supported | disputed | verified`. User-approved is not the same as fact-verified.

### 3.4 Relationship (graph edge)

Directed, typed, within one project; endpoints may be on different pages. Types: `relates_to`, `depends_on`, `supports`, `contradicts`, `enables`. The edge has `owner_page_id` (the page on which it was created/managed); **source_id must belong to the owner page** for MVP. `target_id` may belong to any page in the same project. Editing edge properties requires the owner page active. Reject edges with missing or archived endpoints when trying to validate.

### 3.5 Template and immutable template version

Template is a reusable **page structure**. Scope is either project-local or library/global (single-installation only). A version contains ordered fields/sections, instructions, result types, optional layout hints, and schema identifier. A page is pinned to a specific version. New versions never silently migrate prior pages.

### 3.6 Source material

Locally referenced article/text with title, optional URL, locally captured content path, content digest, and acquisition metadata. URL alone is not a reliable frozen source. Template runs should distinguish source evidence supplied from the AI's own extrapolation.

### 3.7 Template run

One application of a versioned template to one source, targeting one page. Stores draft results and an optional proposal ID. Result is not authoritative until approved.

### 3.8 Proposal and revision

Proposal = ordered operations scoped to one project and one target page, status `pending | approved | rejected | conflicted`. Operations are version-guarded creates, updates, archives, or links. Revision = immutable commit audit with before/after snapshots; write operations are transactional.

## 4. Data graph and invariants

```text
project 1 ── N pages 1 ── N knowledge_objects (same-page tree)
    │                  └── 0..1 template_version (pinned)
    ├── N relationships (cross-page allowed, same project only)
    ├── N source_materials
    ├── N template_runs ── 1 template_version
    ├── N proposals ── N proposal_operations
    └── N revisions ── N revision_changes

templates 1 ── N template_versions
```

**Required invariants:**

1. Parent and child always have same project and page; no cycles.
2. Relationship endpoints belong to the same project; owner page = source object's page.
3. At most one active edge of a given `(owner_page_id, source_id, target_id, type)`.
4. AI proposal has exactly one `page_id`, which must equal the session active page at proposal creation; operation target ownership must match page. Cross-page reference targets are read-only.
5. Every mutation is checked against entity version and session selection version.
6. Approval is an all-or-nothing database transaction; no partial approval in v0.1.
7. Agent tools cannot approve a proposal or switch pages; user-only endpoints require separate server authorization.
8. A template run pins `template_id + template_version`; immutable version rows never update.
9. Validated projection only includes objects with validated ancestors and validated relationships with validated endpoints.
10. Project isolation applies to every query, including FTS and imports.

## 5. SQLite schema (first migration)

This schema is an implementable baseline. Migrations should be checked on the exact SQLite version shipped in the Docker image. Enable `PRAGMA foreign_keys=ON` **on every connection**; use WAL, busy timeout, and prepared statements. IDs are UUID/ULID-style opaque strings; timestamps are UTC ISO 8601 strings.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  brief TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id), -- NULL = global library
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(id, project_id)
);

CREATE TABLE template_versions (
  template_id TEXT NOT NULL REFERENCES templates(id),
  version INTEGER NOT NULL CHECK(version >= 1),
  schema_json TEXT NOT NULL CHECK(json_valid(schema_json)),
  instructions TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  PRIMARY KEY(template_id, version)
);

CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  template_id TEXT,
  template_version INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(id, project_id),
  FOREIGN KEY (template_id, template_version)
    REFERENCES template_versions(template_id, version),
  CHECK ((template_id IS NULL) = (template_version IS NULL))
);

CREATE TABLE knowledge_objects (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  parent_id TEXT,
  type TEXT NOT NULL CHECK(type IN
    ('concept','requirement','decision','assumption','question','field_answer')),
  template_field_key TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  value_json TEXT CHECK(value_json IS NULL OR json_valid(value_json)),
  validation_status TEXT NOT NULL DEFAULT 'working'
    CHECK(validation_status IN ('working','validated','archived')),
  evidence_status TEXT NOT NULL DEFAULT 'unassessed'
    CHECK(evidence_status IN ('unassessed','supported','disputed','verified')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (page_id,project_id) REFERENCES pages(id,project_id),
  UNIQUE(id,project_id),
  UNIQUE(id,page_id,project_id),
  FOREIGN KEY (parent_id,page_id,project_id)
    REFERENCES knowledge_objects(id,page_id,project_id)
    DEFERRABLE INITIALLY DEFERRED,
  CHECK(parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  owner_page_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN
    ('relates_to','depends_on','supports','contradicts','enables')),
  description TEXT NOT NULL DEFAULT '',
  validation_status TEXT NOT NULL DEFAULT 'working'
    CHECK(validation_status IN ('working','validated','archived')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_page_id,project_id) REFERENCES pages(id,project_id),
  FOREIGN KEY(source_id,owner_page_id,project_id)
    REFERENCES knowledge_objects(id,page_id,project_id),
  FOREIGN KEY(target_id,project_id) REFERENCES knowledge_objects(id,project_id),
  CHECK(source_id <> target_id)
);

CREATE TABLE source_materials (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  source_url TEXT,
  content_path TEXT,
  sha256 TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(id,project_id)
);

CREATE TABLE proposals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES client_sessions(id),
  expected_selection_version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected','conflicted')),
  rationale TEXT NOT NULL DEFAULT '',
  source_host TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY(page_id,project_id) REFERENCES pages(id,project_id),
  UNIQUE(session_id,idempotency_key),
  UNIQUE(id,project_id,page_id)
);

CREATE TABLE proposal_operations (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES proposals(id),
  sequence INTEGER NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN
    ('object','relationship','template','page')),
  action TEXT NOT NULL CHECK(action IN
    ('create','update','archive')),
  entity_id TEXT,
  client_ref TEXT,
  expected_version INTEGER,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  UNIQUE(proposal_id,sequence),
  CHECK(entity_id IS NOT NULL OR client_ref IS NOT NULL)
);

CREATE TABLE revisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  page_id TEXT NOT NULL,
  proposal_id TEXT UNIQUE REFERENCES proposals(id),
  actor TEXT NOT NULL,
  source_host TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY(page_id,project_id) REFERENCES pages(id,project_id)
);

CREATE TABLE revision_changes (
  id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES revisions(id),
  sequence INTEGER NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT CHECK(before_json IS NULL OR json_valid(before_json)),
  after_json TEXT CHECK(after_json IS NULL OR json_valid(after_json)),
  UNIQUE(revision_id,sequence)
);

CREATE TABLE template_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_version INTEGER NOT NULL,
  source_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','proposed','accepted','cancelled')),
  result_json TEXT CHECK(result_json IS NULL OR json_valid(result_json)),
  proposal_id TEXT REFERENCES proposals(id),
  created_at TEXT NOT NULL,
  FOREIGN KEY(page_id,project_id) REFERENCES pages(id,project_id),
  FOREIGN KEY(template_id,template_version)
    REFERENCES template_versions(template_id,version),
  FOREIGN KEY(source_id,project_id)
    REFERENCES source_materials(id,project_id)
);

CREATE TABLE client_sessions (
  id TEXT PRIMARY KEY,
  client_kind TEXT NOT NULL,
  active_project_id TEXT REFERENCES projects(id),
  active_page_id TEXT,
  selection_version INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(active_page_id,active_project_id)
    REFERENCES pages(id,project_id)
);

CREATE INDEX ix_projects_status ON projects(status,name);
CREATE INDEX ix_pages_project_order ON pages(project_id,sort_order);
CREATE INDEX ix_objects_outline ON knowledge_objects(page_id,parent_id,sort_order);
CREATE INDEX ix_objects_project_status ON knowledge_objects(project_id,validation_status);
CREATE INDEX ix_edges_source ON relationships(project_id,source_id);
CREATE INDEX ix_edges_target ON relationships(project_id,target_id);
CREATE UNIQUE INDEX ux_active_edges ON relationships
  (project_id,owner_page_id,source_id,target_id,type)
  WHERE validation_status <> 'archived';
CREATE INDEX ix_proposals_page_status ON proposals(page_id,status,created_at);
CREATE INDEX ix_revision_project ON revisions(project_id,created_at);
```

### Schema notes and service-layer enforcement

- `templates.current_version` must reference a real immutable `template_versions` row; enforce in service transaction (creation of v1 needs both rows). Template visibility must be checked: global template or same project as target page.
- The schema permits template/page proposal operation metadata, but **v0.1 agent proposal policy** is narrower: object and relationship mutations on the active page; template definition proposals have an explicit dedicated review flow; page creation or switch always user-authorized. Do not assume entity type in a database column is automatically an allowed agent operation.
- `client_sessions` represents a local session registry, not a full authentication system. Persisted credentials/capability records may be added in migrations after selecting host transports; never make session IDs alone sufficient for authorization.
- Parent cycle detection is an application constraint checked with recursive CTE inside the write transaction. `CHECK(parent_id <> id)` alone does not stop multi-node cycles.
- Cross-page graph reads are valid; cross-page object writes are not.
- A committed revision and each associated before/after snapshot must be retained to support audit and conflict resolution.
- SQLite FTS5 can be added using a virtual table plus synchronized triggers. Search must always join through `knowledge_objects` and filter by `project_id` and visibility. Do not trust global FTS results without project filtering.
- Use explicit archive semantics (do not cascade-delete user knowledge when archiving a page).

### 5.1 Required hardening migration and host/UI pairing

The initial SQL migration above defines knowledge storage, but **does not by itself authorize a human UI versus an MCP agent**. Implement an additional migration **before connecting any cloud host**. The following is a baseline for a fresh v0.1 database; credentials must be generated using a cryptographically secure random source, stored as hashes, and never included in exports. A UI-admin authentication mechanism is also required (not represented by a bare `client_sessions.id`).

```sql
CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  host_kind TEXT NOT NULL CHECK(host_kind IN ('chatgpt','claude','local_test','other')),
  agent_token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

ALTER TABLE client_sessions ADD COLUMN connection_id TEXT REFERENCES connections(id);
CREATE UNIQUE INDEX ux_client_sessions_connection
  ON client_sessions(connection_id) WHERE connection_id IS NOT NULL;

CREATE TABLE local_ui_sessions (
  id TEXT PRIMARY KEY,
  credential_hash TEXT NOT NULL UNIQUE,
  csrf_token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE template_drafts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  originating_page_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES client_sessions(id),
  target_template_id TEXT REFERENCES templates(id),
  expected_template_version INTEGER,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  schema_json TEXT NOT NULL CHECK(json_valid(schema_json)),
  instructions TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected','conflicted')),
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY(originating_page_id,project_id) REFERENCES pages(id,project_id),
  UNIQUE(session_id,idempotency_key)
);

CREATE TABLE template_events (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES templates(id),
  version INTEGER NOT NULL,
  draft_id TEXT REFERENCES template_drafts(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('create','new_version')),
  before_json TEXT,
  after_json TEXT NOT NULL CHECK(json_valid(after_json)),
  created_at TEXT NOT NULL,
  FOREIGN KEY(template_id,version) REFERENCES template_versions(template_id,version),
  CHECK(before_json IS NULL OR json_valid(before_json))
);

CREATE UNIQUE INDEX ux_active_template_fields
  ON knowledge_objects(page_id,template_field_key)
  WHERE type='field_answer' AND template_field_key IS NOT NULL
    AND validation_status <> 'archived';
```

**Pairing model:** A user creates/revokes an agent connection inside the local UI. The MCP request's authenticated connection selects a server-side `client_sessions` context; it cannot supply its own identity. When the user reviews a proposal from that connection in the local browser, the browser reads the proposal's owning session and checks its project/page/selection version. A local UI user's own active tab is **not** automatically assumed to be the same as a ChatGPT or Claude context. The user explicitly selects the target connection and page when switching. Each connection has independent active-page selection. Never use a model-visible pairing code, a UI visibility annotation, Origin, or a self-declared `human_click=true` flag as proof of human authorization.

**Template creation is in MVP:** The agent may propose a *template draft* using `template_propose`, including structure derived from an existing page but excluding its answers. An authenticated local UI action approves the draft, creating the template and immutable version (or a new version) plus `template_events` audit. This is separate from page-scoped `change_propose` and cannot switch the active tab.

**Template analysis is host-model-driven:** The server never claims to invoke a cloud model. The host AI reads the template/source, fills typed results, and calls `change_propose` with optional `analysis_context` (`template_id`, `template_version`, `source_id`, `field_results`), resulting in a proposed `template_runs` entry linked to the pending proposal. Approval marks the run `accepted`; rejection marks it `cancelled`. `template_run_propose` is deferred as a standalone tool to avoid ambiguity.

**Dependency/protocol policy:** Use the exact MCP core version and TypeScript SDK versions pinned in the offline lockfile. The 2025-11-25 and 2026-07-28 core transports differ; do not combine initialization/session semantics from different revisions. The accompanying [Offline implementation handbook](04-offline-implementation-agent-handbook.md) is the implementation-side source of truth for fixtures and offline constraints.

## 6. Template definition shape

A template captures a reusable **analysis method** for pages. Example:

```json
{
  "schema_version": 1,
  "name": "Critical Article Analysis",
  "description": "Analyze arguments, evidence and assumptions consistently.",
  "fields": [
    {"key":"main_argument","label":"Main argument","kind":"short_text","required":true,"prompt":"What is the central claim?"},
    {"key":"evidence","label":"Evidence","kind":"list","required":false,"prompt":"What evidence supports the claim?"},
    {"key":"assumptions","label":"Assumptions","kind":"list","required":false,"prompt":"Which claims are unproven?"},
    {"key":"counterarguments","label":"Counterarguments","kind":"list","required":false,"prompt":"What challenges the claim?"},
    {"key":"implications","label":"Implications","kind":"long_text","required":false,"prompt":"What follows if true?"},
    {"key":"open_questions","label":"Open questions","kind":"list","required":false,"prompt":"What remains unresolved?"}
  ]
}
```

**MVP supported field kinds:** `short_text`, `long_text`, `list`, `number`, `boolean`, `reference` (optional, validate with JSON Schema/Zod). Each instantiated field gets a stable `template_field_key`. New template versions never mutate field keys in existing page instances. A user may ask AI to *propose* a template from an existing page; user approves creation/versioning before reuse.

**Source transparency:** If evidence does not exist, output `null`/empty with `missing_reason`, not a fabricated answer. Source references should include a source ID and optional excerpt/section locator.

## 7. Proposal and approval protocol

### 7.1 AI proposal envelope

```json
{
  "project_id": "proj_research",
  "page_id": "page_article_a",
  "expected_selection_version": 8,
  "idempotency_key": "chat-request-unique-123",
  "rationale": "User asked to add the comparison conclusion",
  "operations": [
    {
      "entity_type": "object",
      "action": "create",
      "client_ref": "new_conclusion",
      "payload": {
        "parent_id": "obj_conclusions",
        "type": "concept",
        "title": "Comparison conclusion",
        "summary": "Article B contests Article A's central premise.",
        "validation_status": "working"
      }
    },
    {
      "entity_type": "relationship",
      "action": "create",
      "client_ref": "link_to_b",
      "payload": {
        "source_ref": "new_conclusion",
        "target_id": "obj_article_b_claim",
        "type": "contradicts"
      }
    }
  ]
}
```

The server derives **session** from authorization, never accepts a forged session ID in an agent payload; it checks `page_id` against that session's active page. Local `client_ref` is resolved at commit. A cross-page link can target `obj_article_b_claim` but cannot update it. For existing entities `expected_version` is mandatory.

### 7.2 Approval transaction

1. Authenticate user-only approval request; verify CSRF/origin/capability and session ownership.
2. `BEGIN IMMEDIATE`; load pending proposal; verify same session page/project and matching `selection_version`.
3. Validate action allowlist, all target ownership, shape, size limits, versions and foreign references.
4. Compute post-mutation hierarchy; reject cycles, broken parent references, invalid endpoints.
5. Apply all operations, allocate IDs, bump object/edge/page/project versions.
6. Insert one revision plus ordered before/after audit records.
7. Update proposal status to `approved`; commit. On failure roll back; mark conflict separately if applicable.
8. Return revision ID and changed object IDs for UI refresh.

If the user selects a different page while a proposal is pending, it remains visible but cannot be silently applied to the new page. Require reselecting the original page and reviewing again (or rejecting/recreating it).

### 7.3 Distinct human validation

Proposal approval = acceptance of a modification; object `validation_status` may remain `working`. A separate human-only `object_validate` operation marks it validated. Verified evidence is also separate. This distinction prevents the app from treating an accepted hypothesis as an established fact.

## 8. MCP tools and contracts

Contracts use illustrative TypeScript types. Validate inputs and outputs with runtime schemas. MCP tools return `structuredContent` plus a compact text fallback, and structured errors (`code`, `message`, optionally `conflicts`). All project IDs are checked against the current authenticated selection.

```ts
type Id = string;
type Layer = 'working' | 'validated';
type View = 'outline' | 'graph' | 'detail';
type CursorPage<T> = {items: T[]; next_cursor: string | null};

// 1: Read-only discovery of selected project and pages.
type ProjectOpenInput = {project_id?: Id};
type ProjectOpenOutput = {
  project?: {id:Id; name:string; brief:string; version:number};
  pages?: {id:Id; title:string; template_id?:Id; sort_order:number}[];
  active_page_id?: Id;
  selection_version?: number;
};
// When no project is selected, return PROJECT_SELECTION_REQUIRED.
// The model must not enumerate unrelated projects.

// 2: Bounded project-wide retrieval, page filter optional.
type KnowledgeReadInput = {
  project_id:Id; page_id?:Id; root_object_id?:Id;
  view:View; layer:Layer; depth?:number; limit?:number; cursor?:string;
};
type KnowledgeReadOutput = {
  project_version:number; objects:KnowledgeObjectSummary[];
  relationships:RelationshipSummary[]; next_cursor:string|null;
};

// 3: Search entire active project, never unrelated projects.
type KnowledgeSearchInput = {
  project_id:Id; query:string; types?:string[];
  layer?:Layer; limit?:number; cursor?:string;
};
type KnowledgeSearchOutput = CursorPage<{
  id:Id; page_id:Id; title:string; summary:string; type:string; score:number;
}>;

// 4: Write only a pending proposal for active page.
type ChangeProposeInput = {
  project_id:Id; page_id:Id;
  expected_selection_version:number; idempotency_key:string;
  rationale:string; operations:ProposalOperation[];
  analysis_context?: {
    template_id:Id; template_version:number; source_id:Id;
    field_results:Record<string, {
      value:unknown; source_locator?:string; missing_reason?:string;
    }>;
  };
};
type ChangeProposeOutput = {
  proposal_id:Id; status:'pending'; page_id:Id;
  preview:{action:string; description:string}[];
};

// 5: Read-only pending proposals.
type ChangeReviewInput = {project_id:Id; page_id?:Id; proposal_id?:Id};
type ChangeReviewOutput = {proposals:ProposalSummary[]};

// 6: Render view through MCP Apps UI resource.
type WorkspaceShowInput = {
  project_id:Id; focus_object_id?:Id; view?:'outline'|'graph'; layer?:Layer;
};
type WorkspaceShowOutput = {
  project_id:Id; active_page_id:Id; view:string;
};

// 7: Read reusable page templates.
type TemplateListInput = {project_id:Id; include_global?:boolean};
type TemplateReadInput = {template_id:Id; version?:number};

// 8: Host model generates structured fields and supplies them as
//    change_propose.analysis_context; server performs no cloud inference.

// 9: Suggest navigation; never switches the active tab.
type PageSwitchSuggestInput = {project_id:Id; target_page_id:Id; reason:string};
type PageSwitchSuggestOutput = {requires_user_action:true; target_page_id:Id};

// 10: Draft a reusable page template or a new immutable version.
type TemplateProposeInput = {
  project_id:Id; originating_page_id:Id; idempotency_key:string;
  name:string; description?:string;
  schema_json: Record<string,unknown>;
  instructions?:string;
  target_template_id?:Id; expected_template_version?:number;
};
type TemplateProposeOutput = {
  template_draft_id:Id; status:'pending';
};
```

**Operational note:** The knowledge server **does not perform AI inference**. For a template run, the host AI reads a template and source, generates structured results, and submits them in `change_propose.analysis_context`. The server validates values against the pinned template, derives page-scoped field-answer operations and links a pending `template_runs` row to the proposal. This is the canonical portable v0.1 flow. A separate `template_run_propose` tool is deferred.

### 8.1 Canonical agent tool list for v0.1

1. `project_open` — read project metadata/pages/current active page.
2. `knowledge_read` — project-wide bounded outline/graph/detail reads.
3. `knowledge_search` — project-wide scoped text search.
4. `source_read` — read explicit local source excerpts with limits.
5. `template_list` / `template_read` — discover reusable page structures.
6. `change_propose` — one active-page mutation proposal; no commit.
7. `change_review` — inspect proposals.
8. `page_switch_suggest` — return navigation *suggestion* requiring a separate user action.
9. `workspace_show` — display UI resource.
10. `template_propose` — propose a new template or immutable version, requiring separate user review.

**Template creation:** `template_propose` is **required in v0.1**. It creates a pending row in `template_drafts`; the user approves a creation or new immutable version through a separately authenticated local UI flow. It does not use unrestricted `change_propose`.

### 8.2 User-only controls (never agent-authorized)

- `project_select`, `page_select`, `page_create`, `page_reorder`, `page_archive`
- `proposal_approve`, `proposal_reject`, `proposal_edit_or_split`
- `object_validate`, `object_edit`, `object_move`
- `template_approve`, `template_create_page`, `template_new_version`
- `project_export`, `project_import`, `backup_restore`

For MCP Apps, the official extension specification includes app-only tool visibility (`_meta.ui.visibility: ["app"]`) and `ui://` resources; treat visibility as *discoverability/transport control*, not the sole authorization mechanism. If a host cannot securely distinguish user-initiated app actions from model tool calls, keep approvals in authenticated local UI.

## 9. MCP UI, transport and deployment

### UI mechanism

Register an MCP tool with `_meta.ui.resourceUri: "ui://knowledge-workspace/main"` and serve an HTML bundle with the MIME profile required by the versioned MCP Apps specification. Keep a plain text/tool-output fallback. The embedded UI should show project title, page tabs, active-page outline/graph and review pane. Switching via UI invokes only the separately authorized `page_select` flow. The local browser UI offers the same behavior.

### Transport adapters

| Host | Proposed path | Verification needed |
|---|---|---|
| ChatGPT | Supported secure MCP tunnel -> local HTTP MCP | Tunnel/account support, authentication, MCP Apps rendering, tool/widget calls |
| Claude Desktop | Local MCP configuration / stdio bridge or supported local connector | Tool discovery, MCP Apps UI support in selected desktop version |
| Claude remote | Authenticated HTTPS tunnel to local MCP when configured | OAuth/tunnel requirements, privacy posture, host support |

No general guarantee of identical panel placement, active-tab lifecycle, or permissions across hosts. Test each version and document limitations.

### Docker packaging

```yaml
services:
  knowledge-workspace:
    build: .
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - ./knowledge-data:/app/data
    environment:
      DATABASE_PATH: /app/data/knowledge.db
      NODE_ENV: production
    restart: unless-stopped
```

Server endpoints: `/mcp` for Streamable HTTP; `/app` for local UI; `/api/*` for authenticated UI operations; `/health` for readiness. Local state lives in a mounted directory. Add versioned migrations and health checks; no secrets committed in Compose files.

## 10. Security and privacy

### Threats

Prompt injection in articles or project text; malicious tool arguments; cross-project leakage; indirect writes to another page; spoofed app-only actions; stale proposal approval; remote tunnel exposure; DNS rebinding; accidental disclosure of entire project to cloud AI; lost local database.

### Baseline controls

- Loopback bind; validate Host/Origin; enforce CSRF protection for browser requests.
- Authenticate every remote/tunneled MCP client; scope it to a local identity/project selection; treat credentials as secrets.
- Separate agent read/propose and UI user-action capabilities at the server.
- Use JSON schema validation, operation allowlists, payload-size limits and pagination.
- Use prepared statements; sanitize rendered Markdown/HTML; never execute source content.
- Audit which records were returned to which host and revisions that changed content; avoid logging raw private text by default.
- Never store cloud AI API keys unless explicitly required for an optional provider feature.
- Back up SQLite using a consistent snapshot API (not an unsafe copy of a live WAL database) plus source assets and template data.
- Describe disclosure accurately: local persistence **does not** mean the selected records stay on-device during cloud inference.

## 11. Acceptance properties for architecture

- P1: Attempting a write to a non-active page fails even if the caller knows its ID.
- P2: Switching a page requires a user-only authenticated action; agent tool has no direct equivalent.
- P3: Reading any page in active project succeeds with valid permissions; reading outside it fails.
- P4: Cross-page edges are allowed, but their owner page/source invariants always hold.
- P5: Pending proposals do not modify authoritative data; approval creates exactly one consistent revision.
- P6: Stale entity versions or stale `selectionVersion` prevent approval.
- P7: Restarting the container preserves project/page/template/revision state.
- P8: A template instance remains tied to its original version after library edits.
- P9: Exported project with two pages, cross-links and template version can be imported without ID collisions/data loss.
- P10: Host rendering differences do not block a complete local-browser workflow.

## 12. References (verified 2026-11-20)

- MCP Apps: https://apps.extensions.modelcontextprotocol.io/
- Versioned MCP Apps spec (UI resource, app-only visibility): https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
- MCP Apps testing: https://apps.extensions.modelcontextprotocol.io/api/documents/testing-mcp-apps.html
- OpenAI Secure MCP Tunnel: https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
- Claude Desktop local MCP: https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop
- Claude remote MCP connectors: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
