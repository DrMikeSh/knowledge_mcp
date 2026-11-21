---
name: codebase-design
description: Define or review service and adapter boundaries when implementing the first Knowledge Workspace slices or introducing a new public interface.
---

# Codebase design

- Start from the package and service boundaries in the offline handbook. Give each public interface the minimum inputs and outputs required by the assigned task.
- Keep authorization, invariants, and transactions in the domain services called by browser and MCP handlers. Keep wire and SDK details in the MCP adapter. Use the canonical shared validators for request and response contracts.
- Place tests where they show observable behavior through those interfaces. Use the plan's direct SQLite checks for guarantees that belong to storage.
- Reuse the existing service when adding a second caller. Escalate material departures from the plan through the manager.

Adapted from [Matt Pocock's codebase design skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/codebase-design/SKILL.md).
