---
type: Reference
title: Data model
description: What the engine reads (snapshot of tasks, repeat configs and day context), the choice records QuestArc stores as one plugin-data key each, what the engine returns (GameView and events), and what Pensum must do with the same data.
tags: [data, engine, plugin-data, sync, pensum]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Data model

Three kinds of data, following the [architecture](architecture.md):

1. **Super Productivity's own data** (tasks, repeat configs, day context):
   read only, never changed by the engine.
2. **Choice records**: what the user decided, stored by QuestArc as plugin
   data, one key per record.
3. **The game view**: computed by the engine from 1 and 2 on every
   evaluation, never stored.

Super Productivity facts used here: [facts](super-productivity-facts.md)
§2–§5.

## 1. Engine input: the snapshot

Both hosts build it with the engine's `snapshotFromHost`
(`packages/engine/src/host-data.ts`) from Super Productivity's task and
repeat objects as stored: the plugin from its API, Pensum from its
backup file through `engine-cli.mjs` (`{ "evaluateHost": … }`). Only
the bound tasks and their repeat configs are kept.

```ts
interface Snapshot {
  day: { todayStr: string; startOfNextDayDiffMs: number; timeZone: string };
  tasks: SnapshotTask[]; // active and archived
  repeatCfgs: SnapshotRepeatCfg[];
  choices: Record<string, unknown>; // key → parsed record value
  journeys: Journey[]; // story format 3, built-in and user-made
}

interface SnapshotTask {
  id: string;
  isDone: boolean;
  doneOn?: number | null; // ms
  wontDoOn?: number | null; // ms; equal to doneOn for "won't do"
  dueDay?: string | null; // YYYY-MM-DD; missing on archived tasks
  created?: number; // ms; noon of the occurrence day for instances
  repeatCfgId?: string | null;
  timeSpentOnDay?: Record<string, number>; // logical day → ms
}

interface SnapshotRepeatCfg {
  id: string;
  isPaused: boolean;
  repeatCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  repeatEvery: number;
  startDate?: string; // YYYY-MM-DD
  repeatUntilDay?: string;
  monday?: boolean; // … sunday
  deletedInstanceDates?: string[];
  repeatFromCompletionDate?: boolean;
  waitForCompletion?: boolean;
}
```

- Field names and meanings are Super Productivity's, so both hosts copy
  them as they are.
- **Hosts may filter:** only tasks whose `repeatCfgId` or `id` appears in
  a binding record, and only bound repeat configs, are needed. Large
  archives therefore cost little. The engine gives the same result with
  the full lists.
- `day` comes from `getDayContext()` (Super Productivity after 19.3.1) and
  the host's time zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`
  in the plugin; the system time zone in Pensum). Older Super
  Productivity versions without `getDayContext()`: offset 0 and the
  browser's local date.

## 2. Choice records

Which records a user action writes is defined once, in the engine
(`packages/engine/src/actions.ts`): the plugin imports the functions,
Pensum calls them through `engine-cli.mjs`.

Each record is its own plugin-data key, written with
`persistDataSynced(JSON.stringify(value), key)`. Super Productivity stores
it as the entity `questarc:<key>` and resolves sync conflicts per key
(last writer wins), so records written on different devices never
overwrite each other. Most records are written once and never changed.

| Key                                   | Value                                                                     | Written when                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `settings`                            | `{ mode: "calm" \| "rpg" }`                                               | onboarding, settings                                                                                 |
| `run:<runId>`                         | `{ journeyId, journeyVersion, startDay, why? , woop? }`                   | a journey is started (own "why", optional plan check)                                                |
| `run-end:<runId>`                     | `{ day, reason: "finished" \| "abandoned" }`                              | the last stage is done, or the user ends the journey                                                 |
| `stage:<runId>:<stageId>`             | `{ acceptedDay }`                                                         | the user accepts a stage                                                                             |
| `binding:<runId>:<stageId>`           | `{ taskId, repeatCfgId?, day }`; `day`: due days start then at the latest | a recurring task is bound or rebound; `repeatCfgId` is missing while a new task waits for its repeat |
| `stage-done:<runId>:<stageId>`        | `{ day, xp, damage }`                                                     | the next stage is accepted, or the journey ends ([deleted history](decisions/deleted-history.md))    |
| `pause:<runId>:<day>`                 | `{ action: "pause" \| "resume", source: "user" \| "repeat-cfg" }`         | the user pauses or resumes; a host sees the bound repeat config paused or unpaused                   |
| `checkin:<runId>:<stageId>:<isoWeek>` | `{ score: 1..7 }`                                                         | the weekly question is answered                                                                      |
| `graduation:<runId>:<stageId>`        | `{ day, choice: "keep" \| "end" }`                                        | the user graduates a habit                                                                           |
| `journey:<journeyId>`                 | a story-format-3 journey                                                  | the user imports or writes a journey                                                                 |

- **Run ids** are random identifiers made by the host when a journey
  starts (`crypto.randomUUID()`); the engine never makes ids. A run is one
  walk through a journey, so a journey can be walked again later.
- **Active journey:** the open run (no `run-end` record) that was started
  or resumed last: the later of its `startDay` and its last `resume`
  record. On the same day a run that is not paused wins, then the larger
  run id. Starting a journey writes a `pause` record for the journey that
  was active; resuming one writes a `resume` record for it and a `pause`
  record for the active one, so a waiting journey's days are never
  misses. If two devices start different journeys before syncing, both
  stay open and one is active; nothing is lost.
- **Withdrawing a record** (undo an acceptance, bring a graduated habit
  back, remove an imported journey): write an empty string to its key.
  `listSyncedDataKeys` lists only non-empty keys, and the engine ignores
  empty ones; there is no API to delete a single key.
- **Reading:** the plugin lists its keys with `listSyncedDataKeys()` and
  loads them with `loadSyncedData(key)`; it reloads after
  `persistedDataChanged` (local writes and remote sync).
- **Limits:** 256 KB per record and at most one write per second per key;
  records are small and written once.
- **2.x data:** QuestArc 2.x used one unkeyed blob (entity `questarc`).
  3.0 never reads or deletes it (decision D8).
- **Uninstalling** the plugin in Super Productivity deletes all its
  records on all devices; the settings page says so.

## 3. Engine output

The types are in `packages/engine/src/types/view.ts`; in short:

```ts
interface GameView {
  todayStr: string;
  mode: 'calm' | 'rpg'; // from the settings record; calm by default
  totalXp: number; // computed in both modes, shown only with the game
  level: number;
  active?: RunView; // the newest open run
  paused: RunView[]; // other open runs
  finished: RunView[]; // runs with a run-end record (the shelf)
  problems: string[]; // records and journeys the engine could not use
}

interface RunView {
  runId: string;
  journeyId: string;
  startDay: string;
  why?: string;
  stations: StationView[];
  position: { stage: number; progress: number }; // current station, 0..1
  paused: boolean; // by a pause record or a paused repeat config
  checkinDue: boolean; // weekly question not answered this ISO week
  offerFallback: boolean; // second miss in a row, not yet followed by a completion
}

interface StationView {
  stageId: string;
  state: 'done' | 'met' | 'current' | 'unbound' | 'unsupported-repeat' | 'ahead';
  progress: number; // 0..1
  run: { current: number; best: number; total: number; gap: boolean };
  xp: number; // earned in this stage; from the checkpoint once done
  completions: number; // days with a counting completion
  welcomeBacks: number;
  acceptedDay?: string;
  doneDay?: string;
  guardian?: { hp: number; damage: number; defeated: boolean };
  // current stage only: the last 7 due or paused days, oldest first
  lastDays?: { day: string; mark: 'done' | 'gap' | 'open' | 'paused' }[];
}
```

When the user accepts the next stage, the host writes the current
station's `xp` and guardian `damage` into the checkpoint record.

`diff(before, after)` returns events `{ key, params }` for toasts:
`event.completion`, `event.welcome-back`, `event.progress-summary` (more
than one new completion at once, e.g. after a sync),
`event.station-reached`, `event.guardian-damaged`,
`event.guardian-defeated`, `event.fallback-offered`, `event.level-up`.
Graduation follows with issue #22. All numbers follow the
[game rules](game-rules.md).

## 4. Pensum

Pensum reads the same records from its dataset:

- `pluginUserData` entries with ids `questarc:<key>`; values of 1024 or
  more characters are stored as `GZ1:<base64 gzip>` and must be decoded.
- To write a record, Pensum adds or replaces that entry, encoded the same
  way, and keeps every other entry untouched. `pensum.store.validate`
  must stay empty.
- Pensum builds the snapshot from its tasks, archives and
  `taskRepeatCfg` slice, runs the engine through gjs
  ([engine in gjs](decisions/engine-in-gjs.md)) and creates repeat
  configs with its own repeating-task code.
