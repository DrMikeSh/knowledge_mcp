# Offline workspace scaffold (T1.1c1–c4)

The root npm workspace links five private packages: server, web, domain, MCP adapter, and shared contracts. The strict NodeNext TypeScript configuration checks the initial domain module without emitting files. No runtime pins changed.

| Factory check | Reviewed result |
|---|---|
| `npm run typecheck` | Exit 0 after the compiler setup and again after declaring the workspaces |
| `npm test` | 7 passed at the compiler setup step |
| `npm install --package-lock-only --offline --no-audit --no-fund --ignore-scripts` | Exit 0; five workspace link records added |
| `npm ci --offline --no-audit --no-fund` | Exit 0; 105 packages installed from the factory cache |
| `npm ls --depth=0` | Exit 0; all five local links and four external pins confirmed |

Build output, lint, format, CI, and migrations remain separate. Keep Docker verification on the trusted runner. Live ChatGPT and Claude checks are **EXTERNAL VERIFICATION PENDING**.

The checkpoint stays local for now because the last attempted factory push could not resolve `github.com`. No merge or update to `main`.
