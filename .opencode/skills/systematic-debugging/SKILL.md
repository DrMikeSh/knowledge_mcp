---
name: systematic-debugging
description: Diagnose a persistent local build, migration, test, or MCP transport failure before attempting a fix.
---

# Systematic debugging

1. Capture the smallest failing command or fixture, the exact error, and the relevant runtime, migration, or protocol versions.
2. Compare with a passing case. Follow the result across the affected handler, service, storage, or transport boundary until you identify the first divergence. Use fixtures and avoid recording credentials or user content.
3. State one cause and test it with a focused check. Once the evidence supports it, fix the affected boundary and rerun the reproducer and adjacent checks.
4. If a local dependency or fixture is missing, report the missing input and the work it blocks. Use the pinned local references for protocol and SDK behavior.

Adapted from [Superpowers systematic debugging](https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md).
