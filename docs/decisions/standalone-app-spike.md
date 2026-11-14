---
type: Decision Record
title: 'Spike: the screens and the engine as a standalone web app'
description: The plugin's screens, adapter and engine run unchanged as an offline web app on a small dataset in Super Productivity's backup format; about 1,250 new lines of TypeScript; its export imports into Super Productivity 19.3.1 and 20.0.0 without repair and the plugin there shows the same journey. Go for the standalone app, with four changes first.
tags: [decision, spike, standalone-app, pwa, backup-format, super-productivity]
generated: { by: claude-code/2.1.325, at: 2026-11-14 }
sources:
  - id: issue93
    title: 'Spike: the screens on a local store, as a PWA (#93)'
    url: https://github.com/nexumia-de/quest-arc/issues/93
  - id: issue91
    title: 'Plan: a standalone habit app (#91)'
    url: https://github.com/nexumia-de/quest-arc/issues/91
  - id: sp
    title: 'Super Productivity 19.3.1, commit 590178d7 (2026-11-04)'
    url: https://github.com/johannesjo/super-productivity/tree/590178d7b9f1214385457625efb9f6abbbe9f980
  - id: pensum-data
    title: "Pensum: Super Productivity's data model (read at the same commit)"
    url: https://github.com/nexumia-de/pensum/blob/main/docs/super-productivity-data.md
---

# Spike: the screens and the engine as a standalone web app

Issue #93[^issue93], the first step of the plan for a standalone habit
app (#91[^issue91]). Nothing here is released; `packages/app` is private
and stays a spike until the plan is decided.

## Question

Can the existing screens and engine run as a standalone web app on a
small dataset in Super Productivity's backup format, with little code
that the plugin does not already have?

## Answer

**Yes. Go**, with the four changes under "Before the next step".

- The screens, the adapter and the engine run **unchanged**: no file
  under `packages/plugin/src` was edited, and the engine got one more
  export (`isScheduled`, so the app does not repeat the schedule rules).
- The new code is about 1,250 lines of TypeScript and 140 lines of CSS,
  nearly half of it the store.
- The built app is 161 KB (46 KB gzipped) in six files and shows its
  first screen 110–165 ms after the start with the CPU slowed four
  times.
- After the first load the page gets every file from the service
  worker's cache; the walk runs offline and sees no request to the
  network.
- A backup exported by the app is imported by Super Productivity 19.3.1
  and 20.0.0 without a validation failure, repair or dialog, and the
  QuestArc plugin there shows the same journey state.

## What was built

`packages/app` (private): the plugin's adapter and screens on a second
host, as one page.

| Part                                                                                     | Files                                          | Lines |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------- | ----- |
| Store: dataset, instances, habits, backup, IndexedDB, plugin-data codec                  | `src/store/`                                   | 572   |
| Host: the plugin API the adapter and screens use, on the store; the day from the setting | `src/host.ts`, `src/day.ts`                    | 162   |
| Wiring: store, host, brain, screens, day change, export and import                       | `src/main.ts`                                  | 170   |
| Frame (tabs, message), Today, Data, the app's texts                                      | `src/shell.ts`, `src/screens/`, `src/texts.ts` | 283   |
| Service worker                                                                           | `src/sw.ts`                                    | 54    |
| Style of the frame, Today and Data; page; build                                          | `src/app.css`, `src/index.html`, `build.mjs`   | 236   |
| Tests (store, host with the plugin's brain) and the two walks                            | `test/`, `e2e/`                                | 633   |

- **Dataset**: Super Productivity's `AppDataComplete` with five slices,
  kept whole under one key in IndexedDB and written after each change.
- **Habits**: a habit is a repeat config with its tasks. At start and
  when the logical day changes (checked every minute and when the page
  becomes visible) the app creates the instance of the newest occurrence
  on or before today, id `rpt_<cfgId>_<day>`, for daily, every n days and
  chosen weekdays, with Super Productivity's rules
  ([facts](../super-productivity-facts.md) §5): not for paused configs, not
  twice, a missed occurrence only without `skipOverdue`.
- **Today**: the habits' tasks due today (and open ones from earlier
  days, which say from when); one tap ticks off, another undoes.
- **Flow B**: "Create the task" creates the repeat config with the
  stage's schedule and its first instance; the screen binds it and the
  journey goes on at once. The hand-over of
  [recurring-task setup](recurring-task-setup.md) is not needed.
- **Data**: export as a `CompleteBackup` file, import of one (Super
  Productivity's exports and bare datasets; another `crossModelVersion`
  is refused) with Undo, and the time a day starts.
- **Offline**: a web manifest and a service worker that keeps the six
  files at install and answers every request from them, never from the
  network. The page's Content-Security-Policy has `connect-src 'none'`.

## Measured

Chromium headless shell (Playwright build 1243) on the cloud machine,
2026-11-14; `npm run e2e -w @questarc/app`.

| What                                                                               | Result                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `app.js` (engine, adapter, screens, six journeys, the ladders' pictures), minified | 143,681 bytes, 41,186 gzipped                     |
| `app.css` (theme, the plugin's style, the app's)                                   | 14,954 bytes, 3,481 gzipped                       |
| `index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg`                          | 2,295 bytes                                       |
| Whole app                                                                          | 160,930 bytes, about 46.0 KB gzipped              |
| Start to the first screen, from the cache, CPU slowed 4×, median of 5              | 110–165 ms over eight runs at both sizes          |
| Requests that reached the network after the first load                             | 0                                                 |
| The plugin's `index.html`                                                          | 84,081 of 102,400 bytes, not changed by the spike |

The start time is a slowed desktop CPU, not a phone; no phone was
measured.

The walk (`e2e/walk.mjs`, 360 × 720 and 1200 × 800, no horizontal
scrolling): empty Today, choose "A gentle morning", start with a reason,
create the task, tick, undo, tick, the message's **Show** opens the
journey with its build; then offline: day 2 (a new instance, "2 of 5
days"), day 11 after a gap ("Welcome back. Your run goes on.", the weekly
look back opens, the card counts "1 of 5 days in the last 7 due days");
export, import of the export (the stored dataset is the exported one).

The import (`e2e/sp-import.mjs`): the exported file through Super
Productivity's own "Import from File" in a fresh profile, clock on the
walk's last day. Its log has no validation failure and no repair, no
dialog opens, its Today shows the task; then the plugin ZIP is installed
and shows "A gentle morning" with the same card and reason. Run against
the Docker image 19.3.1 (the `real-app` job's) and against the live web
app 20.0.0.

## How much of the plugin ran unchanged

| Plugin part                                                                 | Used by the app                                                                                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/`: 39 files, 3,067 lines, and `style.css` (868 lines)               | 37 files as they are. Not used: `main.ts` (82 lines: polling, hooks and retry for the iframe) and the transport in `client.ts` (only its type)                              |
| `src/adapter/`: 10 files                                                    | `brain`, `records`, `hooks`, `repeat-pause`, `day` (`localDay`), `snacks` (`messageFor`), `messages` (`artPack`), `host` (the type). Not used: `context-menu`, `side-panel` |
| `src/shared/`                                                               | all                                                                                                                                                                         |
| `journeys.mjs`, `art.mjs` (the build's virtual modules), `preview/theme.ts` | all three                                                                                                                                                                   |

Walked in the app: welcome, choose, preview, start, set up, journey with
the build, weekly look back. Not walked: continue, finished, shelf,
settings, pick a task, stations, motivates.

While the spike was built, the screens and the engine changed under it
(#58, #59 and others: three more files in `src/ui/`). The app needed no
change and its walk stayed green.

### What a shared `packages/ui` would have to look like

The plan (#91) moves only the screens. The spike shows that more is
shared, and three seams have to be made explicit:

1. **The adapter's core moves too.** `brain`, `records`, `hooks`,
   `repeat-pause`, `day` and `messageFor` are host-independent and
   needed by both hosts. Either they go into the shared package with the
   screens, or into a second one; they must not stay in the plugin.
2. **The screens get their host passed in.** Three screens call the
   global `PluginAPI` (`getAppState` in `ui/app-state.ts`, `addTask` and
   `selectTask` in `ui/screens/setup.ts`). The app had to set a global
   of that name. `createApp(root, client, host)` with a small interface
   for these calls removes the global from the shared code.
3. **`Client` is the seam between screens and brain** and already fits:
   the app implements it in six lines without messages. `sidePanel`
   belongs to the plugin only and becomes optional.
4. The shared package owns the **style and a default theme**. The style
   reads the variables Super Productivity copies into plugin views; the
   app takes them from the plugin's preview (`preview/theme.ts`), which
   is test code. The style also keeps 40 px free for Super
   Productivity's bottom bar, which the app has to undo.
5. **Texts that name the host** need a variant per host: nine keys in
   `content/i18n/en.json` speak of Super Productivity, its task list or
   "Schedule Task" (`ui.card.hint`, `ui.setup.waiting`, `ui.setup.earlier`,
   `ui.settings.data.text`, `ui.error.not-running`, …). The app shows
   them as they are today.
6. The view's key handling (Escape goes back, a tap elsewhere closes the
   menu) sits in the plugin's `main.ts` and is repeated in the app's; it
   belongs into `createApp`.
7. The build's virtual modules for journeys and pictures move with the
   screens.

## What the host interface lacks for a standalone host

`HostApi` (`adapter/host.ts`) covers what the adapter reads. For a host
that owns the data, this is missing or bent:

- **Creating a habit.** The interface has only `addTask`; a plugin
  cannot create a repeat config ([facts](../super-productivity-facts.md)
  §6). The app's `addTask` creates the repeat config and asks the brain
  for the active stage's schedule, which the call does not carry. Wanted:
  `createHabit({ title, schedule })` returning the task and repeat config
  ids, offered only by hosts that can; then the set-up screen binds with
  the `repeatCfgId` and needs no "waiting for the repeat" state there.
- **The calls of the screens** (`getAppState`, `addTask`, `selectTask`)
  are not part of `HostApi` at all (above, 2).
- **Showing a task.** `selectTask` opens Super Productivity's task
  panel; the app can only switch to Today.
- **Messages.** `showSnack` is Super Productivity's; the app has its own
  message line with one action and calls `messageFor` directly.
- Nothing is needed for ticking off, the day setting, export and import:
  those are the host's own screens. They change the store and fire the
  same hook names the plugin registers (`dataChanged`, `dayChange`,
  `persistedDataChanged`), which was enough to keep the brain current.

## The smallest backup Super Productivity imports without repair

Found by importing into 19.3.1 and 20.0.0 and reading the log; the
values of the Inbox, the Today tag and the repeat config's defaults were
taken from Pensum's transcription of Super Productivity 19.3.1 at commit
`590178d7`[^sp][^pensum-data], not read from upstream again.

```json
{
  "timestamp": 0,
  "lastUpdate": 0,
  "crossModelVersion": 4.5,
  "data": {
    "task": {
      "ids": [],
      "entities": {},
      "currentTaskId": null,
      "selectedTaskId": null,
      "lastCurrentTaskId": null,
      "isDataLoaded": false
    },
    "project": { "ids": ["INBOX_PROJECT"], "entities": { "INBOX_PROJECT": {} } },
    "tag": { "ids": ["TODAY"], "entities": { "TODAY": {} } },
    "taskRepeatCfg": { "ids": [], "entities": {} },
    "pluginUserData": []
  }
}
```

(`INBOX_PROJECT` and `TODAY` with all fields of Super Productivity's
defaults, `packages/app/src/store/dataset.ts`.)

- Super Productivity fills the 14 slices that are missing with their
  defaults ("filled missing model slices"), without complaint.
- The `task` slice needs its four state fields; without them the import
  logs "Validation failed, attempting repair" and fixes them.
- Every task needs a project, so the Inbox must exist; the app's habits
  live there and are listed in its `taskIds`.
- The Today tag's `taskIds` must list the live tasks due today, or Super
  Productivity logs "Repairing TODAY_TAG consistency" after loading. The
  app keeps the list when it creates instances. A file exported on one
  day and imported on a later one will presumably get this line anyway
  (not tried); it is Super Productivity's own upkeep of that list.
- A task has the eleven required fields plus `dueDay` and `repeatCfgId`;
  `doneOn` is absent, never `null`. A repeat config has all fields of
  `DEFAULT_TASK_REPEAT_CFG` plus `startDate` and `lastTaskCreationDay`.
- Plugin data is `{ id: "questarc:<key>", data }`. Values of 1024 or
  more characters need **not** be `GZ1:` compressed: 19.3.1 read them
  plain (tried with padded records). The app reads `GZ1:` values and
  writes plain ones. A withdrawn record stays as an entry with `""`.
- `globalConfig` may be missing, but **not partial**: a file with only
  `misc.startOfNextDayTime` fails validation in 20.0.0 with 22 errors
  that are fixed from the defaults. So a day start other than midnight
  needs the whole default configuration in the dataset.
- `pluginMetadata` is not written: the user installs and switches on the
  plugin after the import, as the test does.

## What does not work, or was not tried

- **Day start other than midnight**: the Data screen writes
  `globalConfig.misc` alone; such an export is repaired at import (see
  above). Midnight, the default, exports clean.
- **Older open instances** are not removed on a day change as Super
  Productivity does for configs with `skipOverdue`; a missed day's task
  stays on Today with "from <day>" until it is ticked.
- **Nothing is archived**: every instance stays in the live list, one
  task per habit and day, and the whole dataset is written after each
  change. Fine for the spike; three habits are roughly 400 KB a year.
- Not built, as the issue limits it: skip this time, "won't do", a
  habit's page (schedule, pause, end), adding a habit without a journey,
  reminders, automatic local backups, language, a light and dark switch
  (the app follows the system), two tabs open at once (the last write
  wins).
- **Only Chromium was tried**, headless, on a desktop machine. Not tried:
  Firefox, Safari and iOS, a real phone, installing the app from the
  browser, and whether the browser keeps IndexedDB for a site that is not
  installed (the app does not ask for persistent storage).
- **Updates**: the browser itself asks the server for `sw.js` when the
  app is opened online; that is how a new version arrives. The page makes
  no request.
- Not tried: a large imported Super Productivity dataset (the app would
  show and create its supported recurring tasks, and ignore the rest),
  and the round trip back from Super Productivity into the app.

## Open product question: several habits, one journey

A habit tracker is expected to hold several habits; design rule 3
([design rules](../psychology.md)) allows one active journey.

Proposal, checked against the screens: **one journey grows at a time;
any number of other habits are kept as plain habits on the same Today
screen, with runs but without stages.**

- It already half exists. Today lists the task of every repeat config,
  bound or not, so the habit of a finished stage stays on Today when the
  journey moves on, and "bind a recurring task I already have" picks any
  of them for a stage.
- The journey screens do not change: they show the one active journey,
  and rule 3 stays as it is.
- Missing for the proposal: adding a habit "just to keep" (title and one
  of the three schedules), a habit's page to pause or end it, and a run
  for a habit outside a journey. The run has to come from the engine
  (architecture rule 4), as a function over one repeat config's tasks;
  today it is computed per station only.
- To decide with it: whether a plain habit shows anything besides the
  tick and its run (recommended: no, so that the journey stays the one
  thing that grows).

Recommendation: accept the proposal, and take it into the plan (#91) as
part of step 4 (Today screen and habit page).

## Before the next step

The plan's order stays. Before step 2 (moving the screens):

1. Decide the shared package's cut as under "What a shared `packages/ui`
   would have to look like": screens **and** adapter core, the host
   passed to `createApp`, no global `PluginAPI` in shared code.
2. Add `createHabit` to the host interface, optional for hosts that
   cannot (the plugin).
3. Texts that name the host get a key per host.
4. Take Super Productivity's whole default configuration into the app's
   dataset (Pensum has it transcribed; one copy for both, with its
   source commit), or keep the day start out of the dataset.

## Consequences

- `packages/app` is part of `npm run check` (typecheck, tests, build).
  CI has the job `standalone-app` (walk at both sizes, import into the
  pinned Super Productivity); it is not a required check.
- Nothing in the released plugin changed; its `index.html` is the same
  size.
- Decision D6 ("a plugin and an engine",
  [architecture](../architecture.md)) is not changed by the spike; that
  belongs to the plan's own decision record.
