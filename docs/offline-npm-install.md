# T0.4 — Offline npm dependency checkpoint

B1.2, B1.3a, B1.3, B1.4a and B1.4b are approved after independent review. This checkpoint remains local at the user's request.

- The private root manifest and lockfile pin `@modelcontextprotocol/sdk@1.29.0` and `@modelcontextprotocol/ext-apps@1.7.5`. Their direct registry URLs and SHA-512 integrities in the lockfile match the supplied `.cache/factory/npm/registry-manifest.json`.
- `npm config get cache` returned the project `.cache/factory/npm/cache` in OpenCode. `npm install --package-lock-only --offline --no-audit --no-fund --ignore-scripts` exited 0 and generated the registry lockfile.
- With no root `node_modules` present, `npm ci --offline --no-audit --no-fund` exited 0 and added 97 packages from the factory cache. This verifies the locked install from an empty dependency tree in the existing checkout, not a clean clone or the full T1.1 scaffold.
- Coder and reviewer both ran `npm ls --depth=0` and observed the two exact pins without dependency errors. Generated `node_modules` and the local cache are not part of the checkpoint.

This supersedes the earlier npm input blocker for these pins. MCP protocol negotiation, the complete wire baseline, and Docker build readiness are not verified. Live ChatGPT and Claude checks remain **EXTERNAL VERIFICATION PENDING**.
