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

QuestArc itself is AGPL-3.0-or-later ([LICENSE](../LICENSE)). Nothing
third-party is bundled into the plugin or the engine; all dependencies
below are MIT, Apache-2.0 or BlueOak-1.0.0 and compatible with it.

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

## Overrides

- `minimatch` 11.0.4 (BlueOak-1.0.0, permissive) instead of 10.2.6, which ESLint and
  typescript-eslint pull in: 10.2.6 has a moderate denial-of-service
  advisory (GHSA-g3hv-75wg-m249). Development only; lint was checked to
  still report errors. `npm audit` is clean.

## Runtime

Node 22.23.4 (`.nvmrc`) for development and CI. GitHub Actions:
`actions/checkout` v7.0.1, `actions/setup-node` v7.1.0,
`actions/upload-artifact` v7.0.2, `softprops/action-gh-release` v3.0.4,
each pinned to its commit SHA.
