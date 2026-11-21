---
name: document-reviewed-work
description: Record approved factory work in short Markdown pages and update the documentation index after the manager decides whether to push.
---

# Document reviewed work

1. After a reviewer `PASS`, use the reviewed scope, test evidence, and repository status to decide whether to recommend a push or keep the work local. Escalate conflicting or incomplete verification before publishing.
2. Write a short page for the approved change in `docs/`. Record what changed, the task IDs when available, verified checks, and any remaining manual steps or limitations. Record the push decision as planned or local and report the actual result after Git returns. If the work stays local, record the reason and the instructions sent back to the coder. Update the existing page when it already covers the same subject. Create another small page for a distinct subject.
3. Keep `docs/index.md` as the entry point. Put links to the section headings at the top and links to the Markdown pages under those sections. Use relative links and a brief description for each page. Add links to any user-facing Markdown pages delivered by the coder in the reviewed work. Check the links, including section anchors, before finishing.
4. Stage only the reviewed paths and their documentation using explicit paths after `git add --`. Inspect the staged diff and commit on the task's factory branch. Check the outgoing commits before publishing. Use `git push origin HEAD:refs/heads/factory/<task-slug>` for the matching branch when ready. For `git push origin <full-commit-sha>:refs/heads/main`, obtain explicit human approval for that commit and request one-time OpenCode approval.

Write each page or the index through the sandboxed shell. Read the current page
first when updating it, then pass the complete Markdown as standard input.

```sh
python3 .opencode/write-factory-doc.py docs/example.md <<'FACTORY_DOC'
# Example

Reviewed change and verification.
FACTORY_DOC
```
