---
type: Concept
title: Development
description: Repository layout, commands, how the plugin is built and packed, running the engine in gjs locally, and the hosts the cloud environment needs.
tags: [development, build, workspace, gjs, environment]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Development

## Layout

| Path                      | Job                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/engine`         | Pure game engine: snapshot in, game view out; builds `engine.mjs` and the gjs wrapper `engine-cli.mjs`                                              |
| `packages/engine/vectors` | Test vectors (JSON input → expected output), run in Node and later in gjs                                                                           |
| `packages/plugin`         | Super Productivity plugin: host entry `plugin.ts`, adapter `adapter/`, view `ui/`, shared `shared/`, preview `preview/`                             |
| `packages/sp-plugin-api`  | Unchanged copy of Super Productivity's plugin API types at a pinned commit                                                                          |
| `content/`                | Journeys (`journeys/`, one self-contained file each, CC BY-SA 4.0 in `LICENSE`), pictures (`art/`), UI and message texts (`i18n/`), schema, example |
| `scripts/`                | Maintenance scripts                                                                                                                                 |

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

`npm run journeys` runs only the journey files' schema check and the
journey checker ([story format](story-format.md#the-journey-checker)).

## CI and releases

- `.github/workflows/ci.yml` runs `npm ci` and `npm run check` on every
  pull request and push to `main` (job `check`, the required check in
  `.github/rulesets/main.json`; the owner imports the ruleset) and keeps
  the plugin ZIP as an artifact. Job `real-app`, also required, tries the
  ZIP in Super Productivity ([in the real app](#in-the-real-app)).
- `.github/workflows/release.yml` runs on tags `v<version>`: the tag must
  match `packages/plugin/src/manifest.json`; it runs the checks and
  attaches the ZIP and `SHA256SUMS` to a GitHub release (a tag with `-`
  makes a pre-release). Only the owner pushes tags: merge the pull request
  that sets the version and adds its `CHANGELOG.md` section, then tag the
  merge commit on `main` (`git tag v3.0.0 && git push origin v3.0.0`).
  The README's install steps link to the latest release.
- Dependabot opens weekly pull requests for npm packages and GitHub
  Actions; actions are pinned to a commit SHA with the release as a
  comment.
- Node is pinned in `.nvmrc`.

## Plugin build

`packages/plugin/build.mjs` uses esbuild:

- Journeys come from the module `virtual:questarc-journeys`, which
  `packages/plugin/journeys.mjs` builds from every file in
  `content/journeys/` (for esbuild in `build.mjs` and `preview.mjs`, for
  Vitest in `vitest.config.ts`).

- `plugin.js` as a classic script (IIFE): Super Productivity runs it with
  `new Function`, so it must not contain `import`.
- `index.html` with the view's script and `style.css` inlined: iframe
  plugins get no other files from the ZIP. Both are built without
  whitespace (`minifyWhitespace`; names stay readable), because
  Super Productivity 19.3 installs an `index.html` of at most 100 KB; the
  build fails above it. `plugin.js` stays as it is (limit 5 MB).
- `dist/questarc-<version>.zip` with `manifest.json`, `plugin.js`,
  and `index.html`, packed with fflate. No `icon.svg`: the manifest's
  `"icon": "route"` is a Material icon name.

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
`preview.failMessages('Plugin questarc not found or not loaded')` makes
the view's requests fail as they do while plugin.js is not loaded
(`preview.failMessages(null)` ends it; any other text shows the "could
not read" message with details).
`preview.setRepeat('<task id>')` gives a task a daily repeat, as the user
would in Super Productivity, to try flow B by hand. It uses Playwright
1.64.1 (a development dependency; elsewhere `npx playwright install chromium`;
the cloud image has the headless shell of an older Playwright, build 1243,
and `cdn.playwright.dev` is blocked, so a link
`/opt/pw-browsers/chromium_headless_shell-1248` → `…-1243` made it run on
2026-11-12); open `dist/preview/index.html?demo=walking&theme=dark` in any
browser to look at it by hand.

The pictures (`content/art/`, [decision](decisions/shared-pictures.md))
have their own page, `dist/preview/art.html?theme=light|dark&part=…`
(`preview/art.ts`): `growth` (the meadow at three moments, default),
`shore` and `sizes` (every picture at 48, 32 and 24 px).
`node screenshots.mjs art,art:shore,art:sizes 2` (in `packages/plugin`,
after `npm run preview`) writes them at scale 2; the second argument is
the device scale. The ladders (#42): `sequence-<ladder>[-<marker>]`
(each version, its marker growing element by element, ready, the
lantern, the row of versions), `journey-<ladder>[-ready]` (a static mock
of the journey screen, mid-way or ready) and `palette`; `&hue=<name>`
picks a palette hue. `node screenshots.mjs
art:sequence-crossing,art:journey-home,art:palette 2` writes the
sequences and the palette as one full page 1400 px wide and the mock at
phone size (`art:sequence-crossing@slate` for a hue). The journey screen
itself has the demos `build`, `build-ready` and `build-crossing`
(`node screenshots.mjs build,build-ready,build-crossing 2`);
`preview.tick()` in the console ticks today off, to see new marker
elements grow in. The plugin bundles only the pictures of the ladders
(`esbuildLadderArt` in `art.mjs`); the preview pages have all of them. The ladders' files
come from `node scripts/draw-ladders.mjs`. Day Planner's demo draws the same parts
(`tests/art_demo.py growth|shore|sizes` in nexumia-de/pensum, through
phosh-toolkit's `screenshot.sh -c light|dark`). The comparison images in
`docs/screenshots/valley-*.png` put the plugin's and Day Planner's phone
screenshots side by side (Pillow, 256-colour PNG).

## In the real app

`packages/plugin/e2e/real-app.mjs` tries the built ZIP in Super
Productivity's web app (`app.super-productivity.com`) in a fresh browser
profile with throwaway data: install and enable, start "A gentle
morning", create the task, make it recurring in Super Productivity's own
dialog, tick it off, check the message and the journey (calm mode).
`e2e/real-app-build.mjs` walks the journey screen with the build (#100)
in game mode: start with another ladder (Crossing), tick, open the build
from the message's **Show**, see the first marker element, tick on four
more days (Playwright's clock moves the date; the app is reloaded each
day) until the stage is ready, continue and see the next version. `e2e/real-app-panel.mjs` checks
the side panel setting: no button by default, the button after turning
it on, QuestArc in the right panel (320 px wide at 1200 px). They share
the app steps in `e2e/sp.mjs`. Screenshots go to
`packages/plugin/dist/real-app/`.

```sh
npm run build -w @questarc/plugin
```

```sh
cd packages/plugin && node e2e/real-app.mjs 360 720
```

By default it uses the live app. `QUESTARC_SP_URL` points it at another
one; CI (job `real-app`) runs Super Productivity's Docker image at the
version pinned in `packages/plugin/e2e/Dockerfile` (tag and digest,
updated by Dependabot) and runs the script at 360 × 720 and 1200 × 800
(`npm run e2e -w @questarc/plugin`); screenshots are kept as the artifact
`real-app-screenshots`. The same locally:

```sh
docker build -t questarc-sp packages/plugin/e2e
```

```sh
docker run -d -p 8080:80 questarc-sp
```

```sh
QUESTARC_SP_URL=http://localhost:8080/ npm run e2e -w @questarc/plugin
```

It is not part of `npm run check`, because it needs Docker and a
browser. Uploaded plugins start disabled; the script switches QuestArc on.
The image stays on the oldest supported version (`minSupVersion`
19.3.0): one build serves 19.3.x and later
([decision](decisions/one-build-for-older-versions.md)), so Dependabot
proposes only minor and patch updates. When the pinned version changes,
check the [facts](super-productivity-facts.md) §10.

## Plugin API types

The npm package `@super-productivity/plugin-api` is outdated (1.0.1, June
2025). `packages/sp-plugin-api` holds the types of a pinned upstream
commit; `scripts/update-sp-plugin-api.sh <commit>` replaces them. Keep
the commit in that package's README and in
[Super Productivity facts](super-productivity-facts.md) the same.

## Engine and test vectors

The engine (`packages/engine/src`) has one job per file:

| File               | Job                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------- |
| `types/*.ts`       | Input (snapshot), journey and output (game view) types                                |
| `days.ts`          | Logical days, date arithmetic, ISO weeks                                              |
| `schedule.ts`      | Supported repeat schedules and their occurrences                                      |
| `choices.ts`       | Parsing the choice records                                                            |
| `binding.ts`       | A stage's repeat config and its instances                                             |
| `completions.ts`   | Which day a completion counts for, minutes tracked                                    |
| `timeline.ts`      | Due days, misses, runs, welcome backs                                                 |
| `conditions.ts`    | Stage conditions                                                                      |
| `xp.ts`            | XP and level                                                                          |
| `run.ts`           | One journey run: stations, current stage, guardians, checkpoints                      |
| `validate.ts`      | Structural check of journeys                                                          |
| `evaluate.ts`      | The whole game view                                                                   |
| `diff.ts`          | Events between two views                                                              |
| `actions.ts`       | The choice records each user action writes, for both hosts                            |
| `host-data.ts`     | The snapshot from Super Productivity's raw tasks and configs                          |
| `content-check.ts` | The journey checker                                                                   |
| `cli-gjs.ts`       | The gjs wrapper (`evaluate`, `evaluateHost`, `diff`, `action`, `guardWrite`, `batch`) |

Test vectors (`packages/engine/vectors/*.json`) hold every worked example
of the [game rules](game-rules.md) and the edge cases from the
[Super Productivity facts](super-productivity-facts.md). A vector names a
snapshot (`input`, or `before` and `after` for events; a `guard` vector
adds `writes` for `guardWrite`) and only the fields it checks (`expect`,
where `null` means the field is absent); journeys written as `"$test-daily"` come
from `vectors/journeys/`. `test/vectors.test.ts` runs them in Node,
`test/vectors-gjs.test.ts` through `dist/engine-cli.mjs` in gjs when
`QUESTARC_GJS` names a gjs command. CI installs Ubuntu's `gjs` and sets
it; locally, use the runtime Pensum uses (below) through a small script
that wraps the `bwrap` command, and set `QUESTARC_GJS` to it. A change
to a game rule changes its vector in the same commit.

`test/speed.test.ts` is the speed budget: `test/large-snapshot.ts`
generates a large `evaluateHost` input (about 50,000 archived tasks over
five years, one journey with two finished stages, a bound daily repeat
config with 1,800 days of history; deterministic, never checked in) and the
test fails when Node (300 ms) or gjs (1,000 ms, process start included)
is over budget or when the journey's numbers change. Set
`QUESTARC_SPEED_REPORT` to a file to get the times as Markdown rows; the CI
job `speed-aarch64` writes them to the job summary on an arm64 runner. The
job is not a required check.

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

| Host                                                                                                        | For                                                                                                               | State           |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------- |
| `github.com`                                                                                                | Git, Super Productivity source for the facts and API types                                                        | allowed         |
| `dl.flathub.org`                                                                                            | GNOME runtime for the gjs check                                                                                   | allowed         |
| `www.nature.com`, `pmc.ncbi.nlm.nih.gov`, `www.ncbi.nlm.nih.gov`, `www.ebi.ac.uk`                           | Research: nature.com and PubMed Central pages go through bot checks; full texts come from the Europe PMC API      | allowed         |
| `doi.org`, `api.crossref.org`                                                                               | Research: DOI metadata from Crossref                                                                              | allowed         |
| `refubium.fu-berlin.de`, `kops.uni-konstanz.de`, `www.selfdeterminationtheory.org`                          | Research: open full texts in university and author repositories                                                   | allowed         |
| `www.europarl.europa.eu`                                                                                    | Research: status of EU legislation (Digital Fairness Act)                                                         | allowed         |
| `dl.acm.org`, `www.sciencedirect.com`, `informahealthcare.com`                                              | Research: reachable, but the sites refuse automated requests (403); use Crossref and open copies instead          | refused by site |
| `app.super-productivity.com`                                                                                | Trying the plugin ZIP in the real app (current release, 19.3.1 on 2026-11-06) with throwaway data                 | allowed         |
| `raw.githubusercontent.com`                                                                                 | SPDX licence texts (`content/LICENSE` is SPDX's CC-BY-SA-4.0 text, license-list-data v3.27.0)                     | allowed         |
| `www.interruptions.net`, `hbr.org`                                                                          | Research: author PDFs of interruption studies (index `literature.htm`), HBR article text                          | allowed         |
| `www.hbs.edu`                                                                                               | Research: HBS working papers; reachable, but HBS answers automated requests with 403                              | refused by site |
| `creativecommons.org`, `papers.ssrn.com`, `www.ics.uci.edu`, `pubmed.ncbi.nlm.nih.gov`, `journals.plos.org` | Licence texts; research for First Things First (tested 2026-11-06); PubMed abstracts come from Europe PMC instead | refused         |
| `registry-1.docker.io`, `auth.docker.io`, `production.cloudflare.docker.com`                                | Super Productivity's Docker image for the pinned real-app test                                                    | allowed         |
| `test-app.super-productivity.com`                                                                           | Super Productivity's test build; it ran 18.1.0 on 2026-11-06, older than the plugin needs                         | allowed         |
