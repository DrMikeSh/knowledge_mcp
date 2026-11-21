---
name: offline-preflight
description: Plan or perform the T0.4 offline dependency inventory and MCP protocol selection before scaffolding or starting SDK-dependent work.
---

# Offline preflight

Locate T0.4 in `plan/03-execution-plan-and-definitions-of-done.md` and sections B and M in `plan/04-offline-implementation-agent-handbook.md`. Read only those sections using line ranges. The remote manager assigns the inventory to the local coder and evaluates its evidence. The coder uses the shell allowlist and local assets. Start with `node --version`, `npm --version`, `npm config get cache`, `npm cache ls`, `docker --version`, and `sqlite3 --version`. Run checks separately so a missing tool leaves the other checks runnable.

1. Inventory the Node and npm versions, lockfile and cached packages, pinned Docker base images, SQLite driver and FTS support, local browser runtime, and SDK references and fixtures. Record versions, local paths, and hashes where the plan requires them.
2. Identify one mutually compatible MCP core, SDK, and Apps extension baseline from the available versions. Record the exact versions in `docs/protocol-baseline.md` when established. Keep transport and SDK imports consistent with that baseline.
3. Record the commands and observed results in `docs/offline-inventory.md`. With a lockfile and cache, use `npm ci --offline --no-audit --no-fund`. For missing or incompatible inputs, record the exact artifact, required version where known, and observed failure in `docs/offline-blockers.md`. Report commands that could not run as blocked.
4. Pause work that depends on missing inputs and identify the plan tasks that can proceed from the local specification. Mark live ChatGPT and Claude checks `EXTERNAL VERIFICATION PENDING`.

Write each assigned report with the sandboxed Markdown writer. Pass the complete
page in a quoted heredoc and use read to verify it exists before reporting
completion. Use the same command with `docs/offline-blockers.md` and, when the
baseline is established, `docs/protocol-baseline.md`.

```sh
python3 .opencode/write-factory-doc.py docs/offline-inventory.md <<'FACTORY_DOC'
# Offline inventory

Record the observed results here.
FACTORY_DOC
```
