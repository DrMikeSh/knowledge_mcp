# Offline TypeScript toolchain install (T1.1b1–b4)

The approved root manifest pins `typescript@5.9.3` and `@types/node@22.20.5`. The lockfile records exact npm registry tarball URLs and integrity hashes for those two packages and `undici-types@6.21.0`, the `@types/node` dependency (`~6.21.0`). The new entries do not add peer requirements. Runtime MCP pins did not change. The local artifact store is the content-addressed cache under `.cache/factory/npm/cache`.

| Factory command | Reviewed result |
|---|---|
| `npm install --package-lock-only --offline --no-audit --no-fund --ignore-scripts` | Exit 0; resolved the updated lock offline |
| `npm ci --offline --no-audit --no-fund` | Exit 0; clean install added 100 packages |
| `npm ls --depth=0` | Exit 0; confirmed both toolchain pins, SDK `1.29.0`, and Apps SDK `1.7.5` |

The manifest change also passed the existing seven test cases before the clean install. This checkpoint verifies offline dependency installation and top-level versions, not TypeScript compilation, workspace layout, CI, or Docker. Live ChatGPT and Claude checks are **EXTERNAL VERIFICATION PENDING**.

This checkpoint stays local for now: the preceding push to the matching factory branch failed with `Could not resolve host: github.com` in the factory. No merge or update to `main`.
