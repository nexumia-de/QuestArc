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
| `packages/app`            | Spike, private and not released (#93): the plugin's adapter and screens as a standalone web app ([standalone app](#standalone-app-spike))           |
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
adapter against a fake plugin API in `packages/plugin/test/`, then the
standalone app's store and host), `build`.

`npm run journeys` runs only the journey files' schema check and the
journey checker ([story format](story-format.md#the-journey-checker)).

## CI and releases

- `.github/workflows/ci.yml` runs `npm ci` and `npm run check` on every
  pull request and push to `main` (job `check`, the required check in
  `.github/rulesets/main.json`; the owner imports the ruleset) and keeps
  the plugin ZIP as an artifact. Job `real-app`, also required, tries the
  ZIP in Super Productivity ([in the real app](#in-the-real-app)). Job
  `standalone-app` (not required) walks the spike of the standalone app
  and imports its export into the same Super Productivity
  ([standalone app](#standalone-app-spike)).
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
- `index.html` with the view's script and `start.css` inlined: iframe
  plugins get no other files from the ZIP. Both are built without
  whitespace (`minifyWhitespace`; names stay readable), because
  Super Productivity 19.3 installs an `index.html` of at most 100 KB; the
  build fails above it. `plugin.js` stays as it is (limit 5 MB).
- What is data and not code is not in `index.html`: the UI texts
  (`content/i18n/en.json`), the screens' style (`src/ui/style.css`) and
  the ladders' pictures are in `plugin.js` and reach the view once by
  message ([plugin adapter](plugin-adapter.md), "What the view carries").
  `packages/plugin/view-content.mjs` builds two modules for this (esbuild
  and Vitest): `virtual:questarc-style`, the style without whitespace as
  a text for `plugin.js`, and `virtual:questarc-start-texts`, the four
  texts the view shows before `plugin.js` answers. The build fails when
  it finds other UI texts in `index.html`. Measured on 2026-11-14:
  `index.html` 64,127 of 102,400 bytes (89,774 before, #102); a new text
  or style rule no longer adds to it.
- `dist/questarc-<version>.zip` with `manifest.json`, `plugin.js`,
  and `index.html`, packed with fflate. No `icon.svg`: the manifest's
  `"icon": "route"` is a Material icon name.

Install it in Super Productivity: Settings → Plugins → Choose Plugin File.
Use test data, not real tasks.

The plugin's files, one job each:

| Path            | Job                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/plugin.ts` | Wiring in plugin.js: brain, hooks, messages, header button                                                                                                                                                                                                                                     |
| `src/adapter/`  | The [plugin adapter](plugin-adapter.md): `brain` (evaluate, cache, events), `snapshot`, `records`, `day`, `hooks`, `snacks`, `messages`, `content-pack` and `art-pack` (what the view gets once), `host` (API subset)                                                                          |
| `src/shared/`   | Used by plugin.js and the view: `protocol`, `texts` (i18n, holds no texts itself), `plan` (sentences); plugin.js only: `english` (the UI texts), `content` (built-in journeys)                                                                                                                 |
| `src/ui/`       | The view ([no framework](decisions/plugin-ui-without-framework.md)): `app` (shell, navigation), `client` (messages to plugin.js), `content` (takes in what plugin.js sends), `dom`, `screen` (types), `screens/` (one file per screen), `start.css` (inlined), `style.css` (sent by plugin.js) |
| `preview/`      | Preview page with a fake plugin API and demo data                                                                                                                                                                                                                                              |

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
`journey`, `paired`, `hard-week`, `met`, `stayed`, `skipped`, `comeback`
(the card after a long break, #82), `smaller` (after starting smaller),
`unbound`, `newer`, `build`, `build-ready`, `build-crossing`, and for
the habit a finished journey leaves (`preview/demo-habits.ts`, #22):
`habit` (maintained, the weekly question due, answers of eight weeks),
`graduate` (it can graduate), `graduated` (the question after two
weeks is due), `not-really` (answered so) and `brought-back` (back,
its repeat gone). After a colon come the buttons or menu items to
click first, in order, separated by `>`:
`empty:Menu>Settings`, `graduate:Have a Look`,
`habit:Menu>Shelf` (a name with a comma cannot be given; spaces need
quotes in the shell). In the browser console,
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
(`preview/art.ts`): `sizes` (every picture at 48, 32 and 24 px, the
default). `node screenshots.mjs art:sizes 2` (in `packages/plugin`,
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
(`tests/art_demo.py sizes|sequence-<ladder>|journey-<ladder>|palette` in
nexumia-de/pensum, through phosh-toolkit's `screenshot.sh -c light|dark`).

## In the real app

`packages/plugin/e2e/real-app.mjs` tries the built ZIP in Super
Productivity's web app (`app.super-productivity.com`) in a fresh browser
profile with throwaway data: install and enable, start "A gentle
morning", create the task, make it recurring in Super Productivity's own
dialog, tick it off, check the message and the journey.
`e2e/real-app-build.mjs` walks the journey screen with the build (#100):
start with another ladder (Crossing), tick, open the build
from the message's **Show**, see the first marker element, tick on four
more days (Playwright's clock moves the date; the app is reloaded each
day) until the stage is ready, stay a while, continue and see the next
version, then pass the next stage with **I Already Do This** (#81).
`e2e/real-app-return.mjs` walks coming back after a long break (#82):
the second station ticked once, no card after 13 days, the card after
14, **Start Smaller** with the gap called a pause, the first station
current again with the version standing, and the first tick as a
welcome back. `e2e/real-app-graduation.mjs` walks graduation (#22) with
prepared data: a real recurring task ticked once, then the records of a
finished journey and three high weekly answers written through the
view's own message to plugin.js (`questarc:write`, so they pass
`guardWrite`); the offer, the page with its two choices, "Runs by
itself" with **Open the task**, the shelf, no message when the task is
ticked afterwards, no question after 13 days, the question after 14,
**Not Really**, **Bring It Back** and the habit on the shelf again.
`e2e/real-app-panel.mjs` checks
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

## Standalone app (spike)

`packages/app` (#93) is the plugin's adapter and screens on a second
host: its own dataset in Super Productivity's backup format, kept in
IndexedDB, with a Today screen, export and import. It imports the
plugin's and the engine's sources and copies none. What it showed and
what has to change before it becomes a product:
[decision](decisions/standalone-app-spike.md). It is private and not
released.

```sh
npm run build -w @questarc/app
```

writes `packages/app/dist/app/`: static files for any web server
(`index.html`, `app.js`, `app.css`, the web manifest, the icon and the
service worker `sw.js`, which keeps them and answers every request from
its cache). It needs `http://localhost` or HTTPS; opened from a file it
has no service worker.

```sh
npm run e2e -w @questarc/app
```

walks the built app at 360 × 720 and 1200 × 800 (`e2e/walk.mjs`, served
by `e2e/serve.mjs` on a free port): a journey from start over three
logical days, offline after the first day, export and import; it prints
the start time with the CPU slowed four times. Screenshots and the
exported backup go to `packages/app/dist/walk/`.

```sh
QUESTARC_SP_URL=http://localhost:8080/ npm run e2e:import -w @questarc/app
```

imports that backup into Super Productivity (the same image and variable
as [in the real app](#in-the-real-app); without the variable the live web
app) and fails on a validation failure, a repair or a dialog, then
installs the plugin ZIP and compares the journey. It needs `npm run
build` and the walk first. Where Playwright's own Chromium is not
installed, `QUESTARC_CHROMIUM` names the binary for both scripts (in the
cloud image
`/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`).
Neither is part of `npm run check`.

## Plugin API types

The types come from the npm package `@super-productivity/plugin-api`
(versioned like the app since 20.0.0), pinned exactly as a dev dependency
of `packages/plugin`; Dependabot proposes updates. It is imported with
`import type` only and its global `PluginAPI` is declared through
`types` in `packages/plugin/tsconfig.json`, so nothing of it is bundled
and one build serves Super Productivity 19.3.0 and later
([decision](decisions/one-build-for-older-versions.md)). After an update
check the [Super Productivity facts](super-productivity-facts.md) §10.

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
| `run.ts`           | One journey run: stations, current stage, checkpoints, the build                      |
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

## Look back

`scripts/look-back.mjs` is the owner's look back at the game rules'
numbers (#84). It reads a Super Productivity backup, runs the built
engine on it and prints, per run and stage: due days (done, gaps, still
open, paused), completions, welcome backs, best run, run-ending misses,
days from acceptance to met, how often the backfill window was used and
the weekly answers by ISO week (answered of asked). Ids, days and counts
only, never a title, a note or the user's reason. No network; nothing is
written.

```sh
npm run build -w @questarc/engine
```

```sh
node scripts/look-back.mjs backup.json
```

`--today YYYY-MM-DD` and `--tz <zone>` replace the current logical day
and the system time zone. The day start comes from the backup's
`globalConfig.misc`; records are decoded as Pensum does (`GZ1:`).

The engine shows these numbers only for today's state, and a finished
stage keeps none. The script does not copy a rule: it asks the engine
again, for each day of a stage, with the stage's checkpoint left out and
only the completions known by the end of that day. Settled day marks
(done, gap, paused) are collected from the engine's `lastDays`; the
days to met are the first day the engine says met. A run-ending miss is
a day on which the engine's current run ends (it is shorter than the new
done days explain, or the fallback is offered); it can be missed when a
completion follows on the same day and the run was already empty. The
backfill count reads the stage's completed instances: ticked off the day
after their day (in the window), the same day, or later than the window.
`test/look-back.test.ts` runs the script on a synthetic backup.

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

| Host                                                                                                                                                                                                                                                                                                                                    | For                                                                                                                                                                                                              | State           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `github.com`                                                                                                                                                                                                                                                                                                                            | Git, Super Productivity source for the facts and API types                                                                                                                                                       | allowed         |
| `dl.flathub.org`                                                                                                                                                                                                                                                                                                                        | GNOME runtime for the gjs check                                                                                                                                                                                  | allowed         |
| `www.nature.com`, `pmc.ncbi.nlm.nih.gov`, `www.ncbi.nlm.nih.gov`, `www.ebi.ac.uk`                                                                                                                                                                                                                                                       | Research: nature.com and PubMed Central pages go through bot checks; full texts come from the Europe PMC API                                                                                                     | allowed         |
| `doi.org`, `api.crossref.org`                                                                                                                                                                                                                                                                                                           | Research: DOI metadata from Crossref                                                                                                                                                                             | allowed         |
| `refubium.fu-berlin.de`, `kops.uni-konstanz.de`, `www.selfdeterminationtheory.org`                                                                                                                                                                                                                                                      | Research: open full texts in university and author repositories                                                                                                                                                  | allowed         |
| `www.europarl.europa.eu`                                                                                                                                                                                                                                                                                                                | Research: status of EU legislation (Digital Fairness Act)                                                                                                                                                        | allowed         |
| `dl.acm.org`, `www.sciencedirect.com`, `informahealthcare.com`                                                                                                                                                                                                                                                                          | Research: reachable, but the sites refuse automated requests (403); use Crossref and open copies instead                                                                                                         | refused by site |
| `app.super-productivity.com`                                                                                                                                                                                                                                                                                                            | Trying the plugin ZIP in the real app (current release, 19.3.1 on 2026-11-06) with throwaway data                                                                                                                | allowed         |
| `raw.githubusercontent.com`                                                                                                                                                                                                                                                                                                             | SPDX licence texts (`content/LICENSE` is SPDX's CC-BY-SA-4.0 text, license-list-data v3.27.0)                                                                                                                    | allowed         |
| `www.interruptions.net`, `hbr.org`                                                                                                                                                                                                                                                                                                      | Research: author PDFs of interruption studies (index `literature.htm`), HBR article text                                                                                                                         | allowed         |
| `www.hbs.edu`                                                                                                                                                                                                                                                                                                                           | Research: HBS working papers; reachable, but HBS answers automated requests with 403                                                                                                                             | refused by site |
| `creativecommons.org`, `papers.ssrn.com`, `www.ics.uci.edu`, `pubmed.ncbi.nlm.nih.gov`, `journals.plos.org`                                                                                                                                                                                                                             | Licence texts; research for First Things First (tested 2026-11-06); PubMed abstracts come from Europe PMC instead                                                                                                | refused         |
| `registry-1.docker.io`, `auth.docker.io`, `production.cloudflare.docker.com`                                                                                                                                                                                                                                                            | Super Productivity's Docker image for the pinned real-app test                                                                                                                                                   | allowed         |
| `test-app.super-productivity.com`                                                                                                                                                                                                                                                                                                       | Super Productivity's test build; it ran 18.1.0 on 2026-11-06, older than the plugin needs                                                                                                                        | allowed         |
| `europepmc.org`, `www.ebi.ac.uk`, `eutils.ncbi.nlm.nih.gov`, `link.springer.com`, `www.who.int`, `academic.oup.com`, `www.pnas.org`, `journals.sagepub.com`, `onlinelibrary.wiley.com`, `psycnet.apa.org`, `www.frontiersin.org`, `trialsjournal.biomedcentral.com`, `api.openalex.org`, `api.semanticscholar.org`, `api.unpaywall.org` | Research for the journeys of 2026-11-13: refused by the proxy in that session (`www.ebi.ac.uk` had been allowed before); abstracts and PMC full-text XML came from `www.ncbi.nlm.nih.gov/entrez/eutils/` instead | refused         |
