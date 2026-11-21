# Review, documentation, and push

1. The manager creates a `factory/<task-slug>` branch for new work. The coder implements the task and reports its checks. The reviewer evaluates the changes and returns a verdict.
2. After a `PASS`, the manager decides whether the reviewed work is ready to push or should stay local.
3. The manager records the change, verification, and any follow-up in a short Markdown page under `docs/`. It adds the page to the appropriate section in the [documentation index](index.md).
4. The manager commits reviewed changes and their documentation on the factory branch. It may publish to the matching branch on `origin`. A push to `main` requires explicit human approval.
5. If the work is not pushed, the manager returns it to the coder with the reason and specific instructions. Corrections go through review again. When the next step depends on approval or another external prerequisite, the coder preserves the reviewed work while the manager reports what is needed.

## Write isolation

The manager names the writable files or directories for each assignment and lists any permitted deletions. The reviewer checks the diff against that scope. The coder applies patches and the manager writes Markdown through the sandboxed shell.

Start OpenCode from the project root. Shell commands require Bubblewrap, Python 3, and libseccomp on Linux. The project is the writable host mount, outside files are read-only, and the shell has private temporary storage, processes, and networking. Host Unix sockets are blocked. The shell rejects checkouts with hard-linked files to protect outside aliases. Network access is available to the manager's scoped Git push commands.
