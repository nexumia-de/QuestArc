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

| Host                              | For                                                        | State   |
| --------------------------------- | ---------------------------------------------------------- | ------- |
| `github.com`                      | Git, Super Productivity source for the facts and API types | allowed |
| `dl.flathub.org`                  | GNOME runtime for the gjs check                            | allowed |
| `test-app.super-productivity.com` | Trying the plugin ZIP in the real app with throwaway data  | blocked |
