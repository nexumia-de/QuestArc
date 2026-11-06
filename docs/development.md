---
type: Concept
title: Development
description: Repository layout, commands, how the plugin is built and packed, running the engine in gjs locally, and the hosts the cloud environment needs.
tags: [development, build, workspace, gjs, environment]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Development

## Layout

| Path                      | Job                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `packages/engine`         | Pure game engine: snapshot in, game view out; builds `engine.mjs` and the gjs wrapper `engine-cli.mjs`                  |
| `packages/engine/vectors` | Test vectors (JSON input → expected output), run in Node and later in gjs                                               |
| `packages/plugin`         | Super Productivity plugin: host entry `plugin.ts`, adapter `adapter/`, view `ui/`, shared `shared/`, preview `preview/` |
| `packages/sp-plugin-api`  | Unchanged copy of Super Productivity's plugin API types at a pinned commit                                              |
| `content/`                | Journeys (`journeys/`), texts for journeys, UI and messages (`i18n/`), schema and example                               |
| `scripts/`                | Maintenance scripts                                                                                                     |

## Commands

Node 22.12 or newer.

```sh
npm ci
npm run check
```

`check` runs, in this order: `format:check` (Prettier), `lint` (ESLint;
the engine has extra rules: no clock, no `Math.random`, no console, no
host globals), `typecheck`, `test` (Vitest: engine, then the plugin's
adapter against a fake plugin API in `packages/plugin/test/`), `build`.

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
- `index.html` with the view's script and `style.css` inlined: iframe
  plugins get no other files from the ZIP.
- `dist/questarc-<version>.zip` with `manifest.json`, `plugin.js`,
  `index.html` and `icon.svg`, packed with fflate.

Install it in Super Productivity: Settings → Plugins → Choose Plugin File.
Use test data, not real tasks.

The plugin's files, one job each:

| Path            | Job                                                                                                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/plugin.ts` | Wiring in plugin.js: brain, hooks, messages, header button                                                                                                                                               |
| `src/adapter/`  | The [plugin adapter](plugin-adapter.md): `brain` (evaluate, cache, events), `snapshot`, `records`, `day`, `hooks`, `snacks`, `messages`, `host` (API subset)                                             |
| `src/shared/`   | Used by plugin.js and the view: `protocol`, `texts` (i18n), `plan` (sentences), `content` (built-in journeys)                                                                                            |
| `src/ui/`       | The view ([no framework](decisions/plugin-ui-without-framework.md)): `app` (shell, navigation), `client` (messages to plugin.js), `dom`, `screen` (types), `screens/` (one file per screen), `style.css` |
| `preview/`      | Preview page with a fake plugin API and demo data                                                                                                                                                        |

## Preview and screenshots

Super Productivity's test host is blocked in the cloud environment (see
below), so the view is checked in a preview page: `preview/host.ts` runs
the real adapter on demo data (`preview/demo.ts`, never real tasks) with
a fake plugin API, and loads the built view in an iframe that talks to it
the way Super Productivity's bridge does, and registers the same hooks
plugin.js does. Theme variables for light and
dark are transcribed from Super Productivity's styles (`preview/theme.ts`).

```sh
npm run screenshots -w @questarc/plugin
```

This writes `packages/plugin/dist/screenshots/<demo>-<theme>-<size>.png`
at 360 × 720 and 1000 × 700, light and dark, and prints a warning for any
horizontal overflow. Demos (`preview/demo.ts`): `welcome`, `empty`,
`journey`, `journey-rpg`, `met`, `unbound`; `empty:Settings` clicks the
button named "Settings" first. In the browser console,
`preview.setRepeat('<task id>')` gives a task a daily repeat, as the user
would in Super Productivity, to try flow B by hand. It uses the Playwright and
Chromium that the cloud environment provides (not a dependency of the
repository); open `dist/preview/index.html?demo=walking&theme=dark` in any
browser to look at it by hand.

## In the real app

`packages/plugin/e2e/real-app.mjs` tries the built ZIP in Super
Productivity's web app (`app.super-productivity.com`) in a fresh browser
profile with throwaway data: install and enable, start "A gentle
morning", create the task, make it recurring in Super Productivity's own
dialog, tick it off, check the message and the journey. Screenshots go to
`packages/plugin/dist/real-app/`.

```sh
npm run build -w @questarc/plugin
```

```sh
cd packages/plugin && node e2e/real-app.mjs 360 720
```

It needs the live app, so it is not part of `npm run check`; a pinned
test in CI is #50. Uploaded plugins start disabled; the script switches
QuestArc on.

## Plugin API types

The npm package `@super-productivity/plugin-api` is outdated (1.0.1, June
2025). `packages/sp-plugin-api` holds the types of a pinned upstream
commit; `scripts/update-sp-plugin-api.sh <commit>` replaces them. Keep
the commit in that package's README and in
[Super Productivity facts](super-productivity-facts.md) the same.

## Engine and test vectors

The engine (`packages/engine/src`) has one job per file:

| File             | Job                                                              |
| ---------------- | ---------------------------------------------------------------- |
| `types/*.ts`     | Input (snapshot), journey and output (game view) types           |
| `days.ts`        | Logical days, date arithmetic, ISO weeks                         |
| `schedule.ts`    | Supported repeat schedules and their occurrences                 |
| `choices.ts`     | Parsing the choice records                                       |
| `binding.ts`     | A stage's repeat config and its instances                        |
| `completions.ts` | Which day a completion counts for, minutes tracked               |
| `timeline.ts`    | Due days, misses, runs, welcome backs                            |
| `conditions.ts`  | Stage conditions                                                 |
| `xp.ts`          | XP and level                                                     |
| `run.ts`         | One journey run: stations, current stage, guardians, checkpoints |
| `validate.ts`    | Structural check of journeys                                     |
| `evaluate.ts`    | The whole game view                                              |
| `diff.ts`        | Events between two views                                         |
| `cli-gjs.ts`     | The gjs wrapper (`evaluate`, `diff`, `batch` requests on stdin)  |

Test vectors (`packages/engine/vectors/*.json`) hold every worked example
of the [game rules](game-rules.md) and the edge cases from the
[Super Productivity facts](super-productivity-facts.md). A vector names a
snapshot (`input`, or `before` and `after` for events) and only the
fields it checks (`expect`); journeys written as `"$test-daily"` come
from `vectors/journeys/`. `test/vectors.test.ts` runs them in Node,
`test/vectors-gjs.test.ts` through `dist/engine-cli.mjs` in gjs when
`QUESTARC_GJS` names a gjs command. CI installs Ubuntu's `gjs` and sets
it; locally, use the runtime Pensum uses (below) through a small script
that wraps the `bwrap` command, and set `QUESTARC_GJS` to it. A change
to a game rule changes its vector in the same commit.

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
| `app.super-productivity.com`                                                       | Trying the plugin ZIP in the real app (current release, 19.3.1 on 2026-11-06) with throwaway data            | allowed         |
| `test-app.super-productivity.com`                                                  | Super Productivity's test build; it ran 18.1.0 on 2026-11-06, older than the plugin needs                    | allowed         |
