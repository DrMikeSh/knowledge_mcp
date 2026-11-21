# Knowledge Workspace — Product Vision, Motivation, and MVP Scope

**Version:** 0.1 draft  
**Date:** 2026-11-20  
**Status:** Proposed product specification  
**Companion documents:** [Architecture and data structures](02-architecture-and-data-structures.md) · [Execution plan and DoDs](03-execution-plan-and-definitions-of-done.md) · [Offline implementation handbook](04-offline-implementation-agent-handbook.md)

## 1. Executive summary

Knowledge Workspace is a local-first application that turns conversations with cloud AI assistants into **deliberately structured, user-governed knowledge**. An AI conversation is a place to explore; the persistent project is the source of truth. Users explicitly direct the assistant to propose additions, corrections, and connections. The human decides what gets committed and what is considered validated.

The interaction is organized around **projects as folders**, **pages as tabs within a project**, and **templates as reusable structures for pages**. The AI may read and reason about the entire currently selected project. It proposes actions **only for the active page**. Switching the active page, including switching at the AI's suggestion, requires a user action/approval. Changes to that page are also reviewable proposals; a page switch is not approval of content changes.

The MVP runs in Docker on the user's computer, persists knowledge in SQLite and local files, and is made accessible to ChatGPT and Claude through supported MCP connections. It is important not to equate local persistence with fully local processing: content returned to a cloud AI provider leaves the device during those interactions.

## 2. Motivation and opportunity

### 2.1 The problem

Conversations can be rich but are poor long-term knowledge structures:

- Critical decisions disappear inside long discussions.
- Summaries flatten assumptions and relationships.
- Creating reusable documentation requires copying and reformatting.
- AI-generated assertions can be mistaken for user-approved conclusions.
- Repeated analyses of similar material lack a consistent method.
- Host-specific chat histories do not serve as portable, shared project memory.

### 2.2 The product proposition

> **Think in chat. Build knowledge in pages. Keep ownership of the project.**

The workspace complements AI chat with a structured, persistent artifact and a disciplined workflow that works from the big picture into detail.

Key differentiators:

1. **Intentional capture:** The AI proposes, not silently saves.
2. **Human-authoritative knowledge:** User-approved content is distinguishable from hypotheses and proposals.
3. **One structured model, multiple views:** Outline, page content, and graph relationships derive from the same model.
4. **Reusable ways of thinking:** Templates preserve how a user analyzes an article or problem, not just the resulting text.
5. **Host portability:** The same local project can be accessed from different compatible AI hosts.
6. **Progressive disclosure:** Compact summaries first; details, assumptions, and references on demand.

### 2.3 Target initial user

A technically comfortable individual researcher, strategist, analyst, founder, or product designer working on evolving topics across multiple AI conversations. The Docker-first distribution deliberately prioritizes this audience rather than frictionless mass-market onboarding.

### 2.4 Explicit non-goals

The MVP is **not** a general-purpose AI chat replacement, automatic capture of entire chat transcripts, autonomous knowledge ingestion, unrestricted agent editor, team collaboration platform, evidence-verification engine, or guaranteed native split-screen UI in every host. The AI provider still operates its own chat interface.

## 3. User mental model

```text
Knowledge Workspace (installed locally)
└── Project: AI Regulation Research                 <- folder / full AI read context
    ├── [Overview]                                 <- page / tab
    ├── [Article A]                                <- page / tab (Critical Analysis template)
    ├── [Article B]                                <- page / tab (Critical Analysis template)
    └── [Research Questions]                       <- page / tab

Template Library
└── Critical Analysis v1
    ├── Main argument
    ├── Evidence
    ├── Assumptions
    ├── Counterarguments
    ├── Implications
    └── Open questions
```

- **Project:** Persistent container, shared knowledge context, permissions boundary. One project is active per client/session.
- **Page:** Individual artifact or analysis, represented as a tab. Each page owns its content hierarchy and may reference objects on other pages in the same project.
- **Template:** Versioned specification of a page structure, field prompts, and expected output shapes. The page is an independent instance of a particular template version; later template updates do not overwrite existing pages.
- **Knowledge object:** Concept, requirement, decision, assumption, question, or structured field answer. Each object belongs to exactly one page and occupies one position in that page's tree.
- **Relationship:** Typed, directed link between objects within the same project, potentially across pages.
- **Proposal:** Uncommitted bundle of operations affecting **one page**; reviewed by the user.

## 4. Product principles

| Principle | Operational meaning |
|---|---|
| Project-wide context | AI tools can read all pages of the selected project, within bounded retrieval and security controls. |
| Page-scoped action | Every AI write proposal targets the active page; no silent edits to other pages. |
| User-controlled page selection | AI can request a switch; only a genuine user action changes the active tab/session page. |
| Separate approval gates | Approving a page switch does **not** approve an edit; approving an edit does **not** switch pages. |
| Human-first validation | Committing an edit and validating a claim are separate operations. |
| Working versus validated | Working content may be tentative; validated content is explicitly accepted, not necessarily objectively proven. |
| Big picture first | Default views show short summaries and primary relationships; details are expandable. |
| Structured and portable | Data remains exportable as JSON/Markdown; templates retain definitions and versions. |
| Minimal cloud exposure | Local persistence, authenticated access, bounded reads, deliberate scope and transparent AI disclosure. |

## 5. Primary journeys

### Journey A — Capture a concept

1. User opens Project X and the `Architecture` page.
2. ChatGPT or Claude receives the active project/page context.
3. User says: “Add local storage as a requirement and connect it to privacy.”
4. Agent searches the project to identify existing privacy concepts, then calls `change_propose` targeting `Architecture`.
5. UI shows the proposed node and relationship; no authoritative mutation has happened.
6. User reviews, optionally edits, and approves the proposal.
7. Local server applies changes atomically and records a revision; the page remains active.

**Desired experience:** Few words in chat, clear visual change in artifact, no accidental commit.

### Journey B — Read across pages, write to active page

1. User is on `Article A`; AI can read relevant content from `Article B`.
2. User asks for a comparison and an updated conclusion.
3. AI retrieves both articles but proposes a conclusion **only on Article A**.
4. User approves or rejects the Article A proposal.

**Important:** Cross-page reading does not require page-switch approval; cross-page writing does.

### Journey C — AI requests another page

1. AI proposes editing `Article B` while `Article A` is active.
2. Rather than writing to Article B, it returns a page-switch suggestion with a reason.
3. User explicitly selects/approves `Article B` in the UI.
4. The server changes the session's active page.
5. AI may now propose edits for Article B; each edit requires its own content approval.

### Journey D — Reuse analysis pattern

1. User analyzes Article A using sections: argument, evidence, assumptions, counterarguments, implications.
2. User says: “Save this structure as a template.”
3. AI proposes a new `Critical Analysis` template; user approves.
4. User creates a new page `Article B` using that template.
5. AI analyzes the new article into structured draft fields, clearly marking unsupported fields.
6. User reviews the result; accepted answers become objects on the page.
7. Both pages keep a reference to the template version used.

### Journey E — Resume and switch hosts

1. User restarts Docker or opens the project the next day.
2. Pages, template versions, proposals, approvals, and relationships are intact.
3. User connects from a second supported AI host and opens the same project.
4. The new host reads project context; **its own active-page selection** is initialized or explicitly selected, not inferred from an old chat transcript.

## 6. UX sketch

```text
┌───────────────────────── AI HOST ──────────────────────────────┐
│ Chat / conversation       │ MCP App knowledge artifact         │
│                           │ Project: AI Regulation             │
│ "Compare Articles A/B"    │ [Overview] [Article A*] [Article B]│
│                           │                                     │
│ AI: Short answer, one     │ Article A — Critical Analysis      │
│ next action / question.   │  Main argument                     │
│                           │  Evidence                          │
│ "Add a conclusion"        │  Assumptions                       │
│                           │  Relationships                     │
│                           │  [Review proposed changes]         │
└─────────────────────────────────────────────────────────────────┘
```

This is a **desired interaction pattern**, not a promise of a fixed panel. Host rendering differs. The exact same page UI must also work at `localhost` in a normal browser.

### User-visible statuses

- **Working:** Committed to the project but not human-validated as a claim.
- **Validated:** Explicitly accepted into the validated view.
- **Archived:** Retained historically but hidden from active views.
- **Pending proposal:** Not committed; preview only.
- **Evidence:** Independently marked `unassessed`, `supported`, `disputed`, or `verified` (never conflate with user approval).

## 7. MVP boundaries

### In scope

- Docker-based single-user installation, local SQLite and backup/export.
- Multiple persistent projects with page tabs.
- Project-wide AI retrieval and navigation (bounded queries).
- Active-page-only AI proposals and user-approved switching.
- Local page creation/selection, outline and simple graph rendering.
- Node types, cross-page relationships, assumptions, statuses, versions.
- Proposal/review/apply flow with concurrency protection.
- Reusable versioned templates for creating pages and analyzing another source.
- Local source text or references; no promise of autonomous extraction from all URLs.
- MCP tools and embedded UI where supported; local web fallback.
- ChatGPT/Claude integration smoke tests using supported transport per host.

### Deferred

- Team sharing and real-time collaborative editing.
- Automatic capture of chat histories or third-party private data.
- Autonomous web crawling, citation validation, semantic/vector search.
- Sophisticated rich-text editing, arbitrary custom field widgets, complex diagram manipulation.
- Multi-device sync, template marketplace, plugin ecosystem, role administration.

## 8. Success criteria

1. User creates a project with at least three pages and switches between tabs without losing state.
2. AI reads Article A and Article B while Article A is active, but cannot mutate Article B without an approved page switch.
3. AI proposes multi-object changes; the user sees a diff, approves, and gets one atomic revision.
4. User saves an analysis format as a template, creates another page from it, and uses it without changing Article A.
5. Docker restart preserves projects, page ordering, content, template versions, relationships, and revisions.
6. One host creates an approved change; a second host can later read it.
7. User can export a complete project and restore it locally, including template-version references.

## 9. Risks and decisions to test early

| Risk | Why it matters | Mitigation |
|---|---|---|
| MCP UI host variance | Some hosts may not provide a persistent right-side panel or identical interaction affordances. | Treat embedded UI as enhancement; local browser as canonical fallback. |
| Local != zero data egress | Cloud inference receives selected project content; remote connectors/tunnels also exchange requests. | Disclose clearly, bound retrieval, audit data transfers. |
| Approval fatigue | Constant confirmation can slow the user. | Batch proposals with concise visual diffs; keep page-switch and commit approvals clear. |
| Context size | AI has *permission* to read the whole project, not unlimited context capacity. | Bounded overview, searching, page reads, pagination. |
| Host session mismatch | Different chat clients do not share a UI session state. | Track active page per authenticated connection/session; no global hidden auto-switch. |
| Template drift | Editing a template could invalidate old analyses. | Immutable template versions and pinned page instances. |
| False authority | User-approved assumptions may look fact-checked. | Separate validation from evidence status, preserve source/provenance. |

## 10. Open decisions (do not block basic prototype)

- Should a page contain multiple template blocks or exactly one primary template? **v0.1 default: one optional primary template.**
- Can users apply a template to an already populated page? **v0.1 default: new page only; migration later.**
- How should page-switch approval be presented in each host? **Required invariant: user gesture acknowledged by server; exact widget varies.**
- Should project-wide AI read always be enabled? **v0.1 yes, for the selected project, with clear disclosure.**
- Can a user partially approve a proposal? **v0.1: edit or split, then approve atomically.**

- How important should assumption review be to the individual user? **v0.1 records assumptions and separates validation from evidence; a configurable assumption-priority/strictness control is an open post-MVP UX choice.**

## 11. External technical references (checked 2026-11-20)

- MCP Apps specification and SDK: https://apps.extensions.modelcontextprotocol.io/
- MCP Apps versioned specification: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
- OpenAI Secure MCP Tunnel: https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
- Claude Desktop local MCP documentation: https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop
- Claude remote MCP connectors: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp

These documents are implementation references, not guarantees of availability on every account, plan, client version, or OS.
