---
type: Reference
title: Super Productivity facts
description: >-
  Facts about Super Productivity's plugin system, plugin data, task and
  recurring-task data that QuestArc 3.0 builds on, each checked against the
  upstream source at one recorded commit.
tags: [super-productivity, plugin-api, recurring-tasks, sync, archive]
sources:
  - id: sp
    title: "Super Productivity master c5eb3f6 (2026-11-05)"
    url: https://github.com/johannesjo/super-productivity/tree/c5eb3f6c426ddebd5de3536705b9739af6bf44db
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Super Productivity facts

Checked against Super Productivity (SP) master `c5eb3f6`, app version 19.3.1
in `package.json`, `@super-productivity/plugin-api` 1.0.1 in
`packages/plugin-api/package.json`. Paths are relative to the SP repository
root. "Unverified" marks what the source alone could not settle.

**Release status.** `package.json` was bumped to 19.3.1 on 2026-10-25
(commit `1014df98`). Several plugin features below landed on master after
that and are not ancestors of that commit, so they are expected only in the
next release (marked _unreleased_). Release tags were not available; the
check used `git merge-base --is-ancestor` against the version-bump commits
on master[^sp].

## 1. Packaging

- `PluginManifest` fields: `name`, `id`, `manifestVersion`, `version`,
  `minSupVersion`, `description?`, `author?`, `hooks`, `permissions`,
  `allowedHosts?`, `dataSharing?`, `iFrame?`, `isSkipMenuEntry?`, `type?`
  (`standard`/`issueProvider`), `assets?`, `issueProvider?`, `icon?`,
  `nodeScriptConfig?`, `sidePanel?`, `uiKit?`, `jsonSchemaCfg?`,
  `i18n?.languages` (`packages/plugin-api/src/types.ts`, `PluginManifest`)[^sp].
- Install-time validation requires only `id` (no `:`), `name` and `version`,
  checks `allowedHosts`, and rejects a `minSupVersion` newer than the app
  (`src/app/plugins/util/validate-manifest.util.ts`, `validatePluginManifest`;
  minSupVersion enforcement is commit `c11fd8d9`, _unreleased_)[^sp].
- Permissions: only `nodeExecution`, `http` (with `allowedHosts`, gates
  `PluginAPI.request` only) and `deleteProject` are checked; every other
  declared permission is shown but not enforced
  (`src/app/plugins/plugin-security.ts`, `getDeclaredApiAccess`;
  `docs/plugin-development.md`, "Plugin Manifest")[^sp].
- `hooks` in the manifest is display-only: no code compares
  `registerHook` calls against it (only `plugin-management.component.ts` and a
  log line in `plugin.service.ts` read `manifest.hooks`)[^sp].
- `plugin.js` is not sandboxed: it runs in the app's renderer via
  `new Function('plugin', 'PluginAPI', code)` with a 30 s timeout for the
  top-level run (`src/app/plugins/plugin-runner.ts`)[^sp].
- `index.html` (needs `"iFrame": true`) is loaded as `srcdoc` with sandbox
  `allow-scripts allow-same-origin allow-forms allow-popups allow-modals`;
  same-origin means it is not a security boundary
  (`src/app/plugins/util/plugin-iframe.util.ts`, `PLUGIN_IFRAME_SANDBOX`)[^sp].
- The iframe gets an injected `PluginAPI` shim that calls the host through
  `postMessage` (`API_CALL` → `API_RESPONSE`/`API_ERROR`), limited to
  `ALLOWED_IFRAME_API_METHODS`; every shim method returns a Promise, including
  `translate` (`plugin-iframe.util.ts`)[^sp].
- In the iframe, `registerHeaderButton`, `registerMenuEntry`,
  `registerTaskContextMenuEntry`, `registerSidePanelButton`,
  `registerShortcut` and `registerConfigHandler` are unsupported; they must be
  called from `plugin.js`. `registerHook` and
  `registerWorkContextHeaderButton` work from the iframe
  (`plugin-iframe.util.ts`, `unsupportedIframeRegistration`)[^sp].
- iframe → `plugin.js`: the iframe posts `{type: 'PLUGIN_MESSAGE', messageId,
message}` to the parent; the host calls the handler `plugin.js` set with
  `PluginAPI.onMessage` and answers with `PLUGIN_MESSAGE_RESPONSE`/`_ERROR`
  (`plugin-iframe.util.ts`; `plugin-runner.ts`, `sendMessageToPlugin`;
  `PluginIframeMessageType` in `types.ts`). The shim has no helper for sending;
  the iframe posts the message itself[^sp].
- ZIP: files at the root; `manifest.json` required (≤ 100 KB), `plugin.js`
  ≤ 5 MB, `index.html` ≤ 1 MB, ZIP ≤ 10 MB, `i18n/<lang>.json` translations
  ≤ 5 MB in total (`src/app/plugins/plugin.const.ts`;
  `plugin.service.ts`, ZIP loading). Other files in the ZIP are not served to
  the iframe; CSS and JS must be inlined (`docs/plugin-development.md`,
  "HTML/Iframe Plugins")[^sp].
- **19.3.1 takes an `index.html` of at most 100 KiB**: at `1014df9` the
  ZIP loader checks it against `MAX_PLUGIN_MANIFEST_SIZE` (100 × 1024,
  `plugin.service.ts` line 1096); `MAX_PLUGIN_INDEX_HTML_SIZE` (1 MiB)
  exists only from `668c0769`, unreleased. A larger `index.html` is
  refused at upload and the plugin card never appears (seen 2026-11-12
  with the Docker image of 19.3.1). QuestArc's build therefore minifies
  the view and fails above 100 KiB, and `plugin.js` (5 MB) carries the
  pictures for the view (#100)[^sp].
- Uploaded plugin code is cached per device in IndexedDB `SUPPluginCache`
  (`plugin-cache.service.ts`); enabled plugins are activated at startup
  (`plugin.service.ts`, `_loadEnabledPlugins`). The enabled flag is synced as
  `PLUGIN_METADATA` (`src/app/plugins/store/plugin.actions.ts`)[^sp].
- `packages/plugin-starter`: plain-JS starter with no build step, copied out
  of the repo; `node scripts/pack.mjs` writes `plugin.zip`; includes a
  release workflow. Its README is the recommended start for third-party
  plugins (`packages/plugin-starter/README.md`; `packages/README.md` calls it
  the "copy-out starter for third-party plugins"). Added in `ae754d78`,
  _unreleased_[^sp].
- `packages/plugin-dev`: the bundled plugins and examples, one npm workspace
  that is not part of the root workspace; plugins consume plugin-api and
  vite-plugin via `file:` links (`packages/plugin-dev/README.md`;
  `.github/workflows/plugin-tests.yml`)[^sp].
- `packages/vite-plugin` (`@super-productivity/vite-plugin` 1.0.0): build
  tooling used in-repo only. `npm view @super-productivity/vite-plugin`
  returned 404 on 2026-11-05, so it is not on npm[^sp].
- `@super-productivity/plugin-api` is on npm, but only versions 1.0.0 and
  1.0.1 (both 2025-06-29, `npm view … time`). `publish-plugin-api.yml`
  will publish it on each stable release with the app's version
  (`packages/plugin-api/PUBLISHING.md`); no app-versioned release was on npm
  on 2026-11-05. The npm 1.0.1 therefore lacks newer API members[^sp].

## 2. Plugin data

- `persistDataSynced(data, key?)` / `loadSyncedData(key?)`: without a key the
  entity id is the bare plugin id; with a key it is `<pluginId>:<key>`; `''`
  equals no key (`src/app/plugins/util/plugin-persistence-key.util.ts`,
  `composeId`)[^sp].
- Each entity id is a separate `PLUGIN_USER_DATA` entity with its own op-log
  ops (`plugin.actions.ts`, `upsertPluginUserData` with
  `entityId: pluginUserData.id`)[^sp].
- Conflicts: `PLUGIN_USER_DATA` is an `array` entity with LWW resolution
  (`src/app/op-log/core/entity-registry.ts`); the newer op timestamp wins, on
  a tie the remote side wins (`src/app/op-log/sync/conflict-resolution.service.ts`,
  class doc). So keyed records resolve independently; the whole value of one
  key is replaced, nothing is merged[^sp].
- Limits: 256 KB of uncompressed data per write and per entity
  (`MAX_PLUGIN_DATA_SIZE`), key ≤ 256 characters
  (`MAX_PLUGIN_PERSISTENCE_KEY_LENGTH`), writes per entity coalesced to at
  most one per second; a write inside the window is held and flushed, not
  dropped (`src/app/plugins/plugin-persistence.model.ts`;
  `plugin-user-persistence.service.ts`, `persistPluginUserData`)[^sp].
- Stored form: data of 1024 or more characters is stored as
  `GZ1:<base64 gzip>`; shorter data is stored as is
  (`src/app/plugins/util/plugin-data-codec.ts`, `encodeForPersist`). A reader of
  the backup (Pensum) must decode the `GZ1:` prefix[^sp].
- Backup: `pluginUserData` (array of `{id, data}`) and `pluginMetadata` are
  slices of `AppDataComplete` (`src/app/op-log/model/model-config.ts`,
  `AllModelConfig`, `CROSS_MODEL_VERSION = 4.5`)[^sp].
- `listSyncedDataKeys(prefix?)` lists the plugin's non-empty keys, sorted,
  excluding the legacy unkeyed entry (`types.ts`;
  `plugin-persistence-key.util.ts`, `listPluginPersistenceKeys`; commit
  `65687361`, in 19.3.0)[^sp].
- No API deletes a single key; the only delete is the whole-plugin sweep.
  Unverified beyond a search of `types.ts` and `plugin-bridge.service.ts` for
  delete methods[^sp].
- Uninstall (`plugin.service.ts`, `removeUploadedPlugin`) deletes secrets,
  OAuth tokens, the cached code, all `pluginUserData` entries of the plugin
  (legacy and keyed, `isPluginIdMatch`) and its metadata. The deletes are
  persistent ops, so they sync to other devices. Disabling only changes the
  metadata[^sp].
- `PERSISTED_DATA_CHANGED` fires to the owning plugin for local writes,
  remote sync and full imports, after the initial sync
  (`src/app/plugins/plugin-hooks.effects.ts`, `firePersistedDataChanged$`)[^sp].

## 3. Reading data and hooks

- `getTasks()`: all live tasks, flat, subtasks included
  (`plugin-bridge.service.ts`, `getTasks` → `selectAllTasks`). Tasks are passed
  through unchanged (`plugin-api-mapper.ts`, `taskCopyToTaskData`), so
  internal fields such as `wontDoOn` and `priority` are present at runtime
  although the plugin `Task` type omits them[^sp].
- `getArchivedTasks()`: young and old archive merged, young wins on equal ids
  (`src/app/features/archive/task-archive.service.ts`, `load`);
  `timeSpentOnDay` is normalised to `{}` when missing[^sp].
- `getAppState()`: live `tasks`, `projects` (without `issueIntegrationCfgs`),
  `tags`, `notes`, `taskRepeatCfgs`, `simpleCounters`, `globalConfig`
  (without `sync` and `misc.unsplashApiKey`); a one-time snapshot; no archive
  (`plugin-bridge.service.ts`, `getAppState`). `taskRepeatCfgs` are the full
  internal entities, so `deletedInstanceDates`, `skipOverdue`,
  `repeatUntilDay` etc. are present although `PluginTaskRepeatCfg` omits
  them[^sp].
- `getDayContext()` returns `{ todayStr, startOfNextDayDiffMs }` from
  `DateService` (`plugin-bridge-context.service.ts`). To find a timestamp's
  logical day, subtract `startOfNextDayDiffMs` before taking the local date
  (`types.ts`, `PluginDayContext`). Optional method; _unreleased_
  (`92a5f7d9`)[^sp].
- `DAY_CHANGE {todayStr}`: logical day changed while the app runs (rollover
  or setting change, also re-checked after sleep/focus); not at startup; gated
  on the initial data load (`plugin-hooks.effects.ts`, `dayChange$`).
  _Unreleased_ (`92a5f7d9`)[^sp].
- `DATA_CHANGED` (no payload): task, project or tag feature state changed
  from any source, remote sync included; coalesced with `auditTime(250 ms)`;
  fires about once a second while time tracking runs (`plugin-hooks.effects.ts`,
  `dataChanged$`). It does **not** watch `taskRepeatCfg`, archive or
  plugin data. _Unreleased_ (`92a5f7d9`)[^sp].
- Both new hooks fire on every device; the API docs say to refresh views only
  and not write data in response (`types.ts`, `PluginHooks`)[^sp].
- The other hooks come from `LOCAL_ACTIONS` (`plugin-hooks.effects.ts`
  line 71), so they do not fire for remote ops: `TASK_COMPLETE {taskId, task}`
  (local `updateTask` with `isDone: true`, skipped for won't-do),
  `TASK_UPDATE {taskId, task, changes}`, `TASK_DELETE {taskId}`,
  `TASK_CREATED {taskId, task}` (`addTask`, `addSubTask`),
  `ANY_TASK_UPDATE {action, taskId?, task?, changes?}`,
  `PROJECT_LIST_UPDATE`, `ACTION {action}` (every local action),
  `LANGUAGE_CHANGE {code, newLanguage}`[^sp].
- `CURRENT_TASK_CHANGE {current, previous}` and `WORK_CONTEXT_CHANGE` are
  selector-based (`plugin-hooks.effects.ts`)[^sp].
- `FINISH_DAY {date}` fires from the daily summary before the day is archived;
  `date` can be a past day (`plugin-hooks.effects.ts`, constructor). Each
  handler has a 5 s timeout (`src/app/plugins/plugin-hooks.ts`)[^sp].

## 4. Task fields

- `timeSpentOnDay`: `{ 'YYYY-MM-DD': ms }`, keyed by the logical day
  (`DateService.todayStr()` in
  `src/app/core/global-tracking-interval/global-tracking-interval.service.ts`,
  `consumeCurrentTick`; tick `duration` is a `Date.now()` difference)[^sp].
- `timeSpent`: sum of `timeSpentOnDay` in ms
  (`src/app/features/tasks/util/calc-total-time-spent.ts`). `timeEstimate`: ms
  (default 0, `task.model.ts`, `DEFAULT_TASK`)[^sp].
- `isDone`/`doneOn`: completing sets `doneOn` (ms timestamp of completion,
  or a given `doneOn`); reopening clears it
  (`src/app/features/tasks/store/task.reducer.util.ts`,
  `updateDoneOnForTask`). Completion does not set `dueDay`[^sp].
- `wontDoOn` (since 19.3.0, `8d2467b6`): a task finished as "won't do" is
  `isDone` with `wontDoOn === doneOn`; read it with `isWontDoTask()`
  (`src/app/features/tasks/util/is-wont-do-task.ts`). A progress engine must
  not count such tasks as completed[^sp].
- `dueDay` (`YYYY-MM-DD`) and `dueWithTime` (ms) are mutually exclusive;
  read `dueWithTime` first (`task.model.ts`, `TaskCopy`)[^sp].
- `created`: ms timestamp; for a repeat instance it is noon of the occurrence
  day (`task-repeat-cfg.service.ts`, `created: targetCreated.getTime()`;
  `store/recurrence-date.util.ts`, `setHours(12, 0, 0, 0)`)[^sp].
- `repeatCfgId`, `tagIds`, `projectId` (internal type: required string;
  plugin type: `string | null`), `parentId`, `subTaskIds`: `task.model.ts`,
  `types.ts` `Task`[^sp].

## 5. Recurring tasks

- `TaskRepeatCfg` fields: `id`, `projectId`, `title`, `tagIds`, `order`
  (deprecated), `defaultEstimate?`, `priority?`, `startTime?`, `remindAt?`,
  `isPaused`, `quickSetting` (`DAILY`, `WEEKLY_CURRENT_WEEKDAY`,
  `MONTHLY_CURRENT_DATE`, `MONTHLY_FIRST_DAY`, `MONTHLY_LAST_DAY`,
  `MONTHLY_NTH_WEEKDAY`, `MONDAY_TO_FRIDAY`, `YEARLY_CURRENT_DATE`,
  `CUSTOM`; "no direct effect"), `repeatCycle` (`DAILY`/`WEEKLY`/`MONTHLY`/
  `YEARLY`), `repeatEvery`, `startDate?`, `repeatUntilDay?`, `monday?` …
  `sunday?`, `monthlyWeekOfMonth?`, `monthlyWeekday?`, `monthlyLastDay?`,
  `notes`, `shouldInheritSubtasks?`, `repeatFromCompletionDate?`,
  `waitForCompletion?`, `disableAutoUpdateSubtasks?`, `subTaskTemplates?`,
  `deletedInstanceDates?` (`YYYY-MM-DD[]`), `skipOverdue?`,
  `lastTaskCreation?` (ms, "TODO remove"), `lastTaskCreationDay?`
  (`src/app/features/task-repeat-cfg/task-repeat-cfg.model.ts`)[^sp].
- When: after the initial sync and on every change of the logical day,
  `addAllDueToday()` runs (`src/app/features/tasks/store/task-due.effects.ts`,
  `createRepeatableTasksAndAddDueToday$`). Upstream notes a known gap
  (#6230): no intra-day re-check if that run misses a config[^sp].
- Which configs: not paused, `lastTaskCreationDay` before today, today not in
  `deletedInstanceDates`, and some occurrence due
  (`store/task-repeat-cfg.selectors.ts`, `selectAllUnprocessedTaskRepeatCfgs`)[^sp].
- What: exactly one instance per config and run, for the **newest**
  occurrence on or before today (`store/get-newest-possible-due-date.util.ts`;
  `task-repeat-cfg.service.ts`, `_getActionsForTaskRepeatCfg`). Missed
  occurrences in between are never backfilled; after days offline only the
  latest occurrence is created, possibly with a past `dueDay`[^sp].
- With `skipOverdue`, an occurrence before today is not created; only
  `lastTaskCreationDay` advances (`_getActionsForTaskRepeatCfg`). The UI
  defaults it to on for plain everyday schedules (`model.ts` comment on
  `DEFAULT_TASK_REPEAT_CFG`)[^sp].
- With `waitForCompletion`, no new instance while any live or archived
  instance is undone (`_getActionsForTaskRepeatCfg`)[^sp].
- Instance shape: id `rpt_<cfgId>_<YYYY-MM-DD>` (deterministic, so two devices
  create the same id), `repeatCfgId`, `dueDay` = occurrence day, `created` =
  noon of it, title/estimate/tags/notes from the config
  (`get-repeatable-task-id.util.ts`; `task-repeat-cfg.service.ts`,
  `_getTaskRepeatTemplate`). Turning an existing task into a recurring one
  keeps that task's own id and only sets `repeatCfgId`
  (`src/app/features/tasks/store/task.reducer.ts`, `addTaskRepeatCfgToTask`)[^sp].
- A missed day leaves either no task at all or an undone instance with a past
  `dueDay`. With several live instances of one config, older undone instances
  without progress are deleted on day change: same-day duplicates always,
  older days only with `skipOverdue`; instances that are done or have time
  spent are kept (`store/task-repeat-cleanup.effects.ts`,
  `cleanupDuplicateRepeatInstances$`)[^sp].
- Deleting an instance task does not add its date to `deletedInstanceDates`
  and does not recreate it, because `lastTaskCreationDay` already covers the
  day. `deletedInstanceDates` is written only by "skip instance" in the repeat
  dialog (`dialog-edit-task-repeat-cfg.component.ts`,
  `deleteTaskRepeatCfgInstance`)[^sp].
- Deleting a repeat config clears `repeatCfgId` on all live tasks
  (`src/app/root-store/meta/task-shared-meta-reducers/task-repeat-cfg-shared.reducer.ts`)
  **and** on archived tasks
  (`src/app/op-log/apply/archive-operation-handler.service.ts`,
  `deleteTaskRepeatCfg`). Instance ids keep the `rpt_<cfgId>_` prefix; the
  first instance (a converted task) does not[^sp].
- Archiving happens when the user moves done tasks to the archive (daily
  summary "finish day", or the work view's button), not automatically
  (`src/app/pages/daily-summary/daily-summary.component.ts`,
  `_moveDoneToArchive`; `work-view.component.ts`, `moveDoneToArchive`)[^sp].
- Archived tasks get `isDone: true`, keep `doneOn` (or get "now"/the
  parent's), and lose `dueDay`, `dueWithTime` and `reminderId`
  (`src/app/features/archive/archive.service.ts`, `mapTasksToArchiveFormat`).
  The occurrence day of an archived instance therefore comes from `created` or
  the id, not `dueDay`[^sp].
- archiveYoung → archiveOld: checked on each archive move; if the last flush
  is older than 14 days, top-level tasks with `doneOn` older than 21 days (or
  no `doneOn`) move to archiveOld (`archive.service.ts`,
  `ARCHIVE_ALL_YOUNG_TO_OLD_THRESHOLD`, `ARCHIVE_TASK_YOUNG_TO_OLD_THRESHOLD`;
  `util/sort-data-to-flush.ts`). Task objects move unchanged, so
  `timeSpentOnDay`, `doneOn` and `repeatCfgId` stay[^sp].
- The user-started archive compression deletes all archived subtasks
  (merging their `timeSpentOnDay` into the parent) and clears notes and issue
  fields of tasks done over a year ago (`archive-compression.service.ts`)[^sp].

## 6. Can a plugin create or end a repeat config?

- No API method creates, updates or deletes a `TaskRepeatCfg`; `getAppState`
  only reads them (`types.ts`, `PluginAPI`)[^sp].
- `ALLOWED_PLUGIN_ACTIONS` contains only layout, focus-overlay,
  `toggleStart`, `setCurrentTask`, `setSelectedTask`, `setActiveWorkContext`
  and `updateGlobalConfigSection`; no repeat-config action
  (`src/app/plugins/allowed-plugin-actions.const.ts`)[^sp].
- `addTask` → `TaskService.add(…, isIgnoreShortSyntax)` → `TaskSharedActions.addTask`
  (`plugin-bridge.service.ts`, `addTask`; `task.service.ts`, `add`).
  `ShortSyntaxEffects` parses the title with `isParseRepeat = false`
  (`src/app/features/tasks/store/short-syntax.effects.ts`, `shortSyntax$`).
  `shortSyntax()` parses recurrence only for the add-task bar
  (`short-syntax.ts`, `isParseRepeat` comment;
  `add-task-bar-parser.service.ts` passes `true`), and only
  `add-task-bar.component.ts` then calls `addTaskRepeatCfgToTask`. Confirmed:
  `@every …` in a plugin-created title does **not** create a repeat config[^sp].
- Without `isIgnoreShortSyntax`, the same title is still parsed: `@…` as a
  plain date, `#tag`, `+project`, estimates, and the tokens are stripped from
  the title. Set `isIgnoreShortSyntax: true` for verbatim titles
  (`short-syntax.ts`; `types.ts`, `PluginCreateTaskData`)[^sp].
- `updateTask` rejects only `parentId`, `subTaskIds` and `wontDoOn`
  (`plugin-bridge.service.ts`, `REJECTED_UPDATE_FIELDS`), so `repeatCfgId` can
  be set or cleared (`null` → `undefined`, `plugin-api-mapper.ts`). This is a
  plain field write: no config is created and existing instances are not
  affected. Setting a non-existent id is not checked. Writing it changes SP
  task data, which QuestArc's rules forbid[^sp].

## 7. UI integration

- `registerHeaderButton`: appends; no update, no dedupe; a second call adds a
  second button. Buttons are removed only when the plugin unloads
  (`plugin-bridge.service.ts`, `_registerHeaderButton`,
  `_removePluginHeaderButtons`)[^sp].
- `registerSidePanelButton`: one per plugin; later calls are ignored
  (`_registerSidePanelButton`). `registerMenuEntry`: duplicates by label are
  ignored (`_registerMenuEntry`)[^sp].
- `registerTaskContextMenuEntry({id, label, icon?, showFor?, onClick})`:
  re-registering the same `id` replaces the entry
  (`plugin-task-context-menu-registry.service.ts`, `register`; added in 19.2.0,
  `41324d29`)[^sp].
- `showIndexHtmlAsView()` navigates to `/plugins/<id>/index`
  (`_showIndexHtmlAsView`); manifest `sidePanel: true` loads the UI in the
  right panel (`types.ts`); `showInWorkContext()` mounts it in place of the
  task list for projects and Today (`types.ts`)[^sp].
- `showSnack({msg, type?, ico?, action?})` (action only from `plugin.js`),
  `notify`, `openDialog({title?, htmlContent?, buttons?})` with allowlist-
  sanitised HTML (`ui/plugin-dialog/plugin-dialog.component.ts`),
  `selectTask(id)` opens the task detail panel (`types.ts`)[^sp].
- Theming: the iframe gets the host's theme variables on `:root`
  (`util/plugin-theme-vars.ts`), `--is-dark-theme` (`1`/`0`), the app fonts,
  and a UI kit in `@layer sp-ui-kit` (off with `"uiKit": false`); open views
  follow dark-mode changes live (`plugin-iframe.util.ts`,
  `createThemeVarsCss`; `docs/plugin-development.md`). The kit upgrade is
  `460c2ea1`, _unreleased_. No dark class is set on the iframe body[^sp].
- `PluginAPI.cfg.theme` is `'dark'` only when the setting is explicitly
  "dark"; with "system" it is `'light'` even on a dark system
  (`plugin.service.ts`, `_getBaseCfg`). Use `--is-dark-theme` instead[^sp].
- i18n: `i18n/<lang>.json` per language listed in `manifest.i18n.languages`;
  `translate(key, params)` falls back to `en`, then the key
  (`src/app/plugins/plugin-i18n.service.ts`); `formatDate`,
  `getCurrentLanguage`; `LANGUAGE_CHANGE {code, newLanguage}` on a local
  language change (`plugin-hooks.effects.ts`, `languageChange$`)[^sp].

### What a plugin may show outside its own page (#100)

Checked at `c5eb3f6` and, for 19.3.1, at its version-bump commit `1014df9`
(tag `v19.3.1`); everything below is in both[^sp]:

- **Header button** (`registerHeaderButton`, `plugin.js` only): an icon
  button with a tooltip label and a Material icon name; no picture, no
  badge, no label change after registering
  (`plugin-header-btns.component.ts`).
- **Side panel** (`registerSidePanelButton({label, icon?, onClick})`,
  `plugin.js` only, one per plugin): adds a button next to the play
  button in the main header (`plugin-side-panel-btns.component.ts`) and,
  up to 600 px, an entry in the mobile bottom bar
  (`mobile-bottom-nav.component.html`, `sidePanelButtons`). The button
  toggles the right panel (`togglePluginPanel`), which loads the
  plugin's own `index.html` in an iframe (`plugin-panel-container`,
  `plugin-index` with `showFullUI: false`), beside the work view. It is
  the same document as the full view; the host passes it nothing that
  tells it where it is shown. There is no call to remove the button: it
  goes when the plugin unloads (`_removePluginSidePanelButtons`). The
  manifest's `sidePanel: true` registers this button automatically and
  then drops the side-menu entry for the full view (`plugin-runner.ts`).
  The iframe allowlist names `showIndexHtmlInSidePanel`, but the bridge
  has no such method (`plugin-iframe.util.ts`; no match in
  `plugin-bridge.service.ts`), so a view cannot open the panel itself.
- **Work view** (`showInWorkContext`, `closeWorkContextView`): the
  plugin's `index.html` _in place of_ the task list for Today and
  projects, not beside it; and `registerWorkContextHeaderButton` with
  `showFor` (types.ts).
- **Messages**: `showSnack({msg, type?, ico?, action?})`; the action
  (`{label, onClick}`) only from `plugin.js`, because functions cannot
  cross the iframe's `postMessage`; with an action the snack stays
  visible 10 s instead of the default 3 s (types.ts, `SnackActionCfg`; `plugin-api-mapper.ts`, `ACTION_SNACK_DURATION_MS`).
  `notify({title, body})` is a system notification of 5 s without an
  action (`plugin-bridge.service.ts`, `notify`). `openDialog` shows
  allowlist-sanitised HTML with buttons.
- Nothing else: a plugin cannot draw into the task list, a task row, the
  Today header or the app's badge.

So the plugin's glanceable places are the side panel (QuestArc's page
beside the task list, the user's choice) and the completion message's
action, which opens the full view.

## 8. Mobile

- No code disables plugins on Android or iOS; only `nodeExecution` plugins
  are desktop-only (`plugin.service.ts`, `NODE_ONLY_DESKTOP` placeholder).
  The docs say desktop and mobile apps install community plugins in-app
  (`docs/plugin-development.md`, "Get Listed in the App")[^sp].
- `cfg.platform` is `desktop`, `android` (Android WebView) or `web`; `ios` is
  in the type but never set, so iOS reports `web` (`_getBaseCfg`)[^sp].
- On native, `PluginAPI.request` follows redirects without re-checking hosts
  (`types.ts`, `allowedHosts`). Secrets are per device
  (`docs/plugin-development.md`, "Secret Storage")[^sp].
- Unverified: actual behaviour on a phone (iframe rendering, performance);
  not tested on a device.

## 9. Recent plugin-system changes

From `git log -100 -- src/app/plugins packages/plugin-api` on a separate
history clone (the given checkout is shallow, 50 commits)[^sp]:

- _Unreleased_ after 19.3.1: `92a5f7d9` `DATA_CHANGED`, `DAY_CHANGE`,
  `getDayContext`, `startTracking`/`stopTracking`; `ae754d78` plugin-starter;
  `5a6d557e` AI-oriented docs; `c11fd8d9` minSupVersion enforced;
  `af82c33b` `triggerSync` in iframes; `668c0769` index.html up to 1 MB;
  `0874aac1` counters use the logical day; `0ae49b2a` `dataSharing`;
  `460c2ea1` UI kit upgrade.
- 19.3.0: `65687361` `listSyncedDataKeys`; `8d2467b6`/`1c6fc67c` won't do
  (`wontDoOn`); `6c75b43b` community plugin list.
- 19.2.0 and earlier: `41324d29` task context menu entries; `88e5ba6d`
  `isIgnoreShortSyntax`; `07451069` project moves through the move service;
  `1627ef54` `deleteProject`; `50b2f9ab` LWW for array entities (plugin data);
  `caaf8436` addTask/updateTask aligned with the REST API; `0c070530`
  `request` with `allowedHosts`; `50db311c` `finishDay` hook fixed (dead
  before).

## 10. Seen in the web app (19.3.1, 2026-11-06)

Checked by running the plugin in `app.super-productivity.com`
(`packages/plugin/e2e/real-app.mjs`), not from the source:

- An uploaded plugin is installed disabled; it runs after its switch in
  Settings → Plugins is turned on. The app also adds a side-menu entry for
  plugins with a view.
- The task panel has no "Repeat" entry: a task becomes recurring through
  **Schedule Task → Repeat**, which opens "Make task recurring" with
  "Every day" preselected; saving sets `repeatCfgId` and fires the task
  hooks, so plugin.js picks it up within a few seconds.
- 19.3.1 rejects the `dataChanged` and `dayChange` hooks (they are newer);
  the other hooks, `onMessage`, the header button and the task context
  menu entry work.
- Up to an app width of 600 px the app shows a bottom navigation whose
  round add button reaches about 36 px into the plugin's view
  (`src/app/core-ui/mobile-bottom-nav/`, `XS_BREAKPOINT` in
  `layout.service.ts` at `c5eb3f6`); the task opens as a bottom sheet.
- The in-app community plugin list still shows a "QuestArc" entry with
  the 2.x description (quests, badges, hero profile).
- While plugin.js is not loaded, a view's `PLUGIN_MESSAGE` is answered
  with `PLUGIN_MESSAGE_ERROR` and the text "Plugin <id> not found or not
  loaded" (`PluginRunner.sendMessageToPlugin`), or "Plugin <id> has no
  message handler registered" before `onMessage` ran (`plugin-api.ts`).
  This happens at app start (enabled plugins are activated one after
  another, `_loadEnabledPlugins`), after switching a plugin on and after a
  re-upload (`reloadPlugin` tears the runtime down, then activates it
  again) (`plugin.service.ts` at `c5eb3f6`)[^sp].
- Plugin icons: a header button takes only a Material icon name
  (`<mat-icon>{{ button.icon }}</mat-icon>`, `plugin-header-btns.component.ts`).
  The side-menu entry of a view plugin gets `manifest.icon || 'extension'`
  (`plugin-runner.ts`); when the ZIP holds a file of that name, it is used
  as an SVG, otherwise the name is used as a Material icon
  (`magic-nav-config.service.ts`, `_buildPluginItems`). The plugin card in
  Settings → Plugins shows only an SVG and falls back to the puzzle icon.
  An SVG is drawn under `fill: currentColor` on its `<svg>` root
  (`plugin-icon.component.ts`), which fills outline paths unless every
  shape sets its own `fill`; the sanitizer keeps only presentation
  attributes (`sanitize-svg-icon.util.ts`) (all at `c5eb3f6`)[^sp].
  Checked in 19.3.1: after an update from a ZIP with `icon.svg` to one with
  `"icon": "route"`, the side menu and page header show the Material icon,
  also after a reload.
- Uploading the ZIP of a plugin that is already installed (same `id`)
  replaces it: the plugin stays enabled and its plugin data stays.
  **Remove** on the plugin's card deletes its plugin data. Checked in the
  Docker image `johannesjo/super-productivity:v19.3.1`, which serves the
  same web build as the app (nginx, port 80).

## Consequences for QuestArc (from the facts above)

- Store stage ↔ repeat-config bindings in plugin data, but also record the
  instance ids or the `rpt_<cfgId>_` prefix: deleting a config wipes
  `repeatCfgId` from live and archived tasks.
- Take an instance's occurrence day from `created` (or the id), not `dueDay`:
  archiving clears `dueDay`.
- Expect no instance for missed days, and exclude won't-do tasks.
- `minSupVersion` must be the next release if QuestArc uses
  `DATA_CHANGED`, `DAY_CHANGE` or `getDayContext`; they are optional members,
  so feature-detect.

[^sp]:
    Super Productivity master c5eb3f6 (2026-11-05),
    https://github.com/johannesjo/super-productivity/tree/c5eb3f6c426ddebd5de3536705b9739af6bf44db
