---
type: Reference
title: Dependencies
description: Every dependency of QuestArc with version, licence and whether it ships in the plugin or the engine.
tags: [dependencies, licences]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Dependencies

Versions are pinned exactly in `package.json`; the lockfile pins the
rest. Licences read from each package's `package.json` in
`node_modules`.

## Shipped

Nothing third-party is bundled into the plugin or the engine.

| Copy in the repository   | Version / source                         | Licence | Holder          |
| ------------------------ | ---------------------------------------- | ------- | --------------- |
| `packages/sp-plugin-api` | Super Productivity `c5eb3f6`, types only | MIT     | Johannes Millan |

## Development only

| Package             | Version | Licence    | Use                           |
| ------------------- | ------- | ---------- | ----------------------------- |
| `esbuild`           | 0.28.2  | MIT        | Bundling engine and plugin    |
| `fflate`            | 0.8.3   | MIT        | Packing the plugin ZIP        |
| `typescript`        | 6.0.3   | Apache-2.0 | Type checking                 |
| `vitest`            | 5.1.0   | MIT        | Tests                         |
| `ajv`               | 8.20.0  | MIT        | Journey schema check in tests |
| `eslint`            | 10.14.0 | MIT        | Lint                          |
| `@eslint/js`        | 10.0.1  | MIT        | Lint rules                    |
| `typescript-eslint` | 8.72.1  | MIT        | Lint for TypeScript           |
| `globals`           | 17.14.0 | MIT        | Lint globals                  |
| `prettier`          | 3.9.10  | MIT        | Formatting                    |
| `@types/node`       | 22.20.5 | MIT        | Types for tests and scripts   |

TypeScript stays on 6.0 because typescript-eslint 8 supports TypeScript
below 6.1; TypeScript 7 is the new native compiler.
