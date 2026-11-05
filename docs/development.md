---
type: Concept
title: Development
description: Repository layout, commands, how the plugin is built and packed, running the engine in gjs locally, and the hosts the cloud environment needs.
tags: [development, build, workspace, gjs, environment]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Development

## Layout

| Path                      | Job                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/engine`         | Pure game engine: snapshot in, game view out; builds `engine.mjs` and the gjs wrapper `engine-cli.mjs` |
| `packages/engine/vectors` | Test vectors (JSON input → expected output), run in Node and later in gjs                              |
| `packages/plugin`         | Super Productivity plugin: host entry `plugin.ts`, iframe view `ui/`, packing                          |
| `packages/sp-plugin-api`  | Unchanged copy of Super Productivity's plugin API types at a pinned commit                             |
| `content/`                | Journeys and i18n texts (empty until the story format exists)                                          |
| `scripts/`                | Maintenance scripts                                                                                    |

## Commands

Node 22.12 or newer.

```sh
npm ci
npm run check
```

`check` runs, in this order: `format:check` (Prettier), `lint` (ESLint;
the engine has extra rules: no clock, no `Math.random`, no console, no
host globals), `typecheck`, `test` (Vitest, engine), `build`.

## CI and releases

- `.github/workflows/ci.yml` runs `npm ci` and `npm run check` on every
  pull request and push to `main` (job `check`, the required check in
  `.github/rulesets/main.json`; the owner imports the ruleset) and keeps
  the plugin ZIP as an artifact.
- `.github/workflows/release.yml` runs on tags `v<version>`: the tag must
  match `packages/plugin/src/manifest.json`; it runs the checks and
  attaches the ZIP and `SHA256SUMS` to a GitHub release (a tag with `-`
  makes a pre-release).
- Dependabot opens weekly pull requests for npm packages and GitHub
  Actions; actions are pinned to a commit SHA with the release as a
  comment.
- Node is pinned in `.nvmrc`.

## Plugin build

`packages/plugin/build.mjs` uses esbuild:

- `plugin.js` as a classic script (IIFE): Super Productivity runs it with
  `new Function`, so it must not contain `import`.
- `index.html` with the view's script inlined: iframe plugins get no other
  files from the ZIP.
- `dist/questarc-<version>.zip` with `manifest.json`, `plugin.js`,
  `index.html` and `icon.svg`, packed with fflate.

Install it in Super Productivity: Settings → Plugins → Choose Plugin File.
Use test data, not real tasks.

## Plugin API types

The npm package `@super-productivity/plugin-api` is outdated (1.0.1, June
2025). `packages/sp-plugin-api` holds the types of a pinned upstream
commit; `scripts/update-sp-plugin-api.sh <commit>` replaces them. Keep
the commit in that package's README and in
[Super Productivity facts](super-productivity-facts.md) the same.

## Engine in gjs

`flatpak run` does not work in the cloud container (no session
services). Run gjs from the GNOME runtime's files with `bwrap` instead:

```sh
flatpak --user install -y flathub org.gnome.Platform//51
```

```sh
R=$(flatpak --user info --show-location org.gnome.Platform//51)/files
bwrap --ro-bind "$R" /usr --symlink usr/lib /lib --symlink usr/lib64 /lib64 --symlink usr/bin /bin --ro-bind "$R/etc" /etc --proc /proc --dev /dev --bind "$PWD" "$PWD" --chdir "$PWD" gjs -m packages/engine/dist/engine-cli.mjs < snapshot.json
```

On a normal desktop or the phone, `flatpak run --command=gjs
--filesystem=host org.gnome.Platform//51 -m …` does the same. Results:
[engine in gjs](decisions/engine-in-gjs.md).

## Cloud environment hosts

Needed beyond the package registries; tested 2026-11-05:

| Host                                                                               | For                                                                                                          | State           |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------- |
| `github.com`                                                                       | Git, Super Productivity source for the facts and API types                                                   | allowed         |
| `dl.flathub.org`                                                                   | GNOME runtime for the gjs check                                                                              | allowed         |
| `www.nature.com`, `pmc.ncbi.nlm.nih.gov`, `www.ncbi.nlm.nih.gov`, `www.ebi.ac.uk`  | Research: nature.com and PubMed Central pages go through bot checks; full texts come from the Europe PMC API | allowed         |
| `doi.org`, `api.crossref.org`                                                      | Research: DOI metadata from Crossref                                                                         | allowed         |
| `refubium.fu-berlin.de`, `kops.uni-konstanz.de`, `www.selfdeterminationtheory.org` | Research: open full texts in university and author repositories                                              | allowed         |
| `www.europarl.europa.eu`                                                           | Research: status of EU legislation (Digital Fairness Act)                                                    | allowed         |
| `dl.acm.org`, `www.sciencedirect.com`, `informahealthcare.com`                     | Research: reachable, but the sites refuse automated requests (403); use Crossref and open copies instead     | refused by site |
| `test-app.super-productivity.com`                                                  | Trying the plugin ZIP in the real app with throwaway data                                                    | blocked         |
