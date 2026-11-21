---
name: verification-before-completion
description: Review a Knowledge Workspace task against its acceptance criteria, the actual diff, and fresh offline test evidence.
---

# Verification before completion

1. Compare the actual diff and relevant new files with the assigned task IDs and definitions of done. For behavior changes, inspect the tests and map them to their acceptance cases.
2. For authority or data changes, check the relevant invariants in the plan. Focus on host-bound selection, agent versus human authority, active-page proposal scope, and atomic approval and revision creation.
3. Check whether the coder's report identifies the actual command and result for the reviewed revision. Ask the manager to route missing or stale checks back to the coder. A reviewer reports which evidence it inspected.
4. Return a verdict with file and line references for actionable findings. Mark unavailable local evidence as blocked and live ChatGPT or Claude checks `EXTERNAL VERIFICATION PENDING`.

Adapted from [Superpowers verification before completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md).
