---
name: tdd
description: Implement a Knowledge Workspace behavior or regression one failing test at a time through the boundary specified by its task and acceptance criteria.
---

# Test-driven development

1. Read the assigned task and matching acceptance cases. Use the service, API, MCP adapter, or UI boundary that the task specifies. Use SQLite integration tests where the plan directly requires migration or persistence evidence.
2. Write one test for an observable outcome, using a deterministic fixture and an expected result from the plan. Run it and confirm it fails for the intended reason. A missing dependency or runtime is a blocker to record.
3. Make the smallest change that satisfies the case. Rerun the targeted check, then run the relevant neighboring checks before handing off. Add cases incrementally when the task requires them.
4. Report task and case IDs, commands, observed results, and unverified checks. For rejected operations, assert both the expected rejection and preservation of committed state where the plan requires it.

Adapted from [Matt Pocock's TDD skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md).
