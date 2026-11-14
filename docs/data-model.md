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
  startTime?: string; // "H:MM"; with remindAt, instances get a reminder (game rules §9)
  remindAt?: string; // Super Productivity's reminder option, e.g. "AtStart", "DoNotRemind"
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
- `day` comes from `getDayContext()` (Super Productivity 20.0.0 and newer) and
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

| Key                                        | Value                                                                     | Written when                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `run:<runId>`                              | `{ journeyId, journeyVersion, startDay, why? }`                           | a journey is started (with the user's own "why")                                                     |
| `run-end:<runId>`                          | `{ day, reason: "finished" \| "abandoned" }`                              | the last stage is done, or the user ends the journey                                                 |
| `stage:<runId>:<stageId>`                  | `{ acceptedDay }`                                                         | the user accepts a stage                                                                             |
| `binding:<runId>:<stageId>`                | `{ taskId, repeatCfgId?, day }`; `day`: due days start then at the latest | a recurring task is bound or rebound; `repeatCfgId` is missing while a new task waits for its repeat |
| `stage-done:<runId>:<stageId>`             | `{ day, dataFormat: 2 }`                                                  | the next stage is accepted, or the journey ends ([deleted history](decisions/deleted-history.md))    |
| `pause:<runId>:<day>`                      | `{ action: "pause" \| "resume", source: "user" \| "repeat-cfg" }`         | the user pauses or resumes; a host sees the bound repeat config paused or unpaused                   |
| `checkin:<runId>:<stageId>:<isoWeek>`      | `{ score: 1..7 }`                                                         | the weekly question is answered                                                                      |
| `stay:<runId>:<stageId>`                   | `{ day }`                                                                 | the user stays a while at a met station (quiets the offer for 7 days)                                |
| `skip:<runId>:<stageId>`                   | `{ day, dataFormat: 3 }`                                                  | the user passes an offered stage with "I already do this"                                            |
| `plan-check:<runId>`                       | `{ wish?, outcome?, obstacle?, plan? }`: the user's own words             | a journey is started with the optional plan check, or the user saves it later                        |
| `pair:<runId>:<stageId>`                   | `{ text }`: the user's own words, at most 60 characters                   | the user names what they pair the stage with, or continues from a stage that has one                 |
| `carry-on:<runId>:<stageId>`               | `{ day }`                                                                 | the user carries on after a long break (closes the card for this gap)                                |
| `step-back:<runId>:<stageId>:<day>`        | `{ dataFormat: 4, until? }`; `stageId` is the stage left, `day` the day   | the user starts smaller after a long break; `until` is added when the stage left is taken up again   |
| `graduation:<runId>:<stageId>:<day>`       | `{ choice: "end" \| "keep", until? }`; `day` is the day of graduation     | the user lets a finished journey's habit graduate; `until` is added when it is brought back          |
| `graduation-later:<runId>:<stageId>`       | `{ day }`                                                                 | the user answers the offer to graduate with "Not Now" (quiet for 28 days)                            |
| `graduation-check:<runId>:<stageId>:<due>` | `{ day, still: true \| false }`; `due` is the date the question was due   | the user answers "does it still run by itself?" after graduation                                     |
| `reminder-seen:<runId>:<stageId>`          | `{ on: true \| false, day }`: a reminder seen on the task, or none since  | a host sees the reminder of a followed stage's task come or go                                       |
| `journey:<journeyId>`                      | a story-format-3 journey                                                  | the user imports or writes a journey                                                                 |
| `anchor:<anchorId>`                        | `{ kind: "routine", words, name? }` or `{ kind: "time", time, name? }`    | the user names a moment in their day, changes its words or time, or gives it a name                  |
| `run-anchor:<runId>`                       | `{ anchorId, after? }`; `after` is the run of the step it follows         | a journey is started from an anchor, or the user confirms the anchor of an earlier journey           |
| `build:<runId>`                            | `{ ladder?, marker?, hue? }`: names of the ladders in `content/art/`      | the user chooses what the run builds, what hangs on its marker or its hue (when starting or later)   |

- **No settings record.** QuestArc before 3.3 wrote `settings`
  (`{ mode: "calm" | "rpg" }`); the mode is gone (#110), the engine
  reads nothing from the record and never writes it. It can still be
  withdrawn with the other records.
- **Checkpoints** (`stage-done`) written before 3.3 also carry `xp` and
  `damage`; the engine reads only `day`. An engine before 3.3 refuses a
  checkpoint without these two fields and would show the stage as not
  finished, so the checkpoint carries `dataFormat: 2`: there the run is
  read-only until that host is updated (below).
- **Staying** (`stay`, [game rules](game-rules.md) §4) is one record per
  stage, rewritten when the user stays again. It changes nothing that
  is computed, only how loudly the offer is shown, so an older engine
  may ignore it and it carries no data format (#85).
- **Skipping** (`skip`, game rules §4) is written together with the
  acceptance of the next stage (`skipStage`) and withdrawn together
  with it (`undoSkip`). An engine that does not know skipping (3.3 and older) would still work on the
  skipped stage and overwrite the next stage's acceptance, so the record
  carries `dataFormat: 3`: there the run is read-only until that host is
  updated (below). Taking the skip back lowers the run's format again.
- **Own words** (`pair`, design rule 7): what the user enjoys only
  while doing the stage's habit, one record per stage, rewritten when
  the user changes it and withdrawn when they empty it (`pairStage`).
  Hosts write one line: white space collapsed, at most 60 characters
  (`PAIR_LIMIT`), no final full stop (`pairWords`), so it fits the end
  of the plan sentence. `continueJourney` copies it to the next stage
  unless that has its own. The engine returns it as the station's
  `pair` and reads no meaning from it; it changes nothing that is
  computed, so an older engine may ignore it and it carries no data
  format (#85). The text stays in the record: never in a task's title
  or notes, never in a log, never sent anywhere.
- **The plan check** (`plan-check`, design rule 6) is one record per
  run with the answers the user gave, rewritten as a whole and
  withdrawn when all are empty (`checkPlan`: one line each, white space
  collapsed, at most 160 characters, `PLAN_CHECK_LIMIT`). It is its own
  record, not a field of `run`, so that changing it later never
  rewrites the record a run is found by. The engine returns it as the
  run's `planCheck`, only the answers that are text, and reads no
  meaning from it; like the pairing it is own words: no data format,
  never in a task, a log or a request.
- **Coming back** ([game rules](game-rules.md) §5). `carryOn` writes
  `carry-on`, one record per stage, rewritten for a later gap; it only
  closes a card, so an older engine may ignore it and it carries no
  data format. `callItAPause` writes two ordinary `pause` records
  (`source: "user"`): `pause` on the gap's first day, `resume` today.
- **Stepping back** (`step-back`, game rules §4) is one record per
  step back, written by `stepBack` (with `{ pause: true }` together
  with the two pause records). `continueJourney` from the smaller
  stage rewrites it with `until`, the day the stage left was taken up
  again, and writes nothing else. An engine that does not know it (the one
  before #82) would keep working on the stage left, so the record
  carries `dataFormat: 4`: there the run is read-only until that host
  is updated (below). The record stays after `until`, because the days
  in between must stay not due for the stage left.
- **Graduation** ([game rules](game-rules.md) §6). `graduate` writes
  one `graduation` record per graduation, keyed by its day, with what
  the user does with the task (`choice`); it returns no changes unless
  the view says the habit can graduate. `bringBack` rewrites that
  record with `until`, the day the habit is followed again, and never
  withdraws it: the days in between must stay not due, as with a step
  back. A habit that graduates again gets a second record.
  `answerStill` writes `graduation-check` under the date the question
  was due (`habit.graduated.checkDue`), so two devices answering the
  same question write the same key; it returns no changes while no
  question is due. `graduateLater` writes `graduation-later`, one record
  per habit, rewritten each time the user says "Not Now" to the offer;
  it only quiets the offer for 28 days and changes nothing else, so it
  is a record and not device memory: the offer is quiet on every
  device. All three kinds are read only for the last stage of a
  finished journey. None of them carries a data format
  ([decision](decisions/data-format.md)): an engine that does not know
  them computes nothing for a finished journey's habit. Anchors are their own records (below).
- **What a host saw of a reminder** (`reminder-seen`,
  [game rules](game-rules.md) §9). Like a paused repeat, a task's
  reminder carries no dates, so the host records the day
  (`reminderSeen`, written by the adapter, not by a user action): `on`
  when it sees a reminder no record knows, `off` with the day when the
  record says `on` and the task has none. One record per stage,
  rewritten; two devices that see the same change on the same day
  write the same value. It is an observation, not something derived
  from the tasks: the tasks do not hold it. The engine reads it only
  for graduation (game rules §6); no record means "never set". It
  carries no data format ([decision](decisions/data-format.md)).
- **Anchors** ([game rules](game-rules.md) §8, design rule 2).
  `nameAnchor` writes one `anchor` record per anchor, rewritten as a
  whole (last writer wins): a routine in the user's words that
  completes "After …", or a fixed time `HH:MM` (24 hours), and
  optionally the name the user gives its place. Hosts write one line
  each: white space collapsed, at most 40 characters (`ANCHOR_LIMIT`),
  no final full stop (`anchorWords`). The id is made by the host, like
  a run id. The record belongs to no run: it is the one kind besides
  `journey` that is not run-scoped, and it changes nothing an older
  engine computes. `removeAnchor` withdraws it while nothing stands
  there. The words are own words: never in a task's title or notes
  unless the user sets the task up with them (the suggested title of
  a new task), never in a log, never sent anywhere. Fields a later
  engine adds (the kind of region, #114) are ignored and kept.
- **A run's anchor** (`run-anchor:<runId>`) is its own record, not a
  field of `run`, because journeys from before anchors get it later
  and `run` is the record a run is found by. `startJourney` writes it
  with the run; `anchorRun` rewrites it (with or without `after`, the
  run of the step it follows); `confirmAnchor` writes it for every run
  of a journey from before anchors. A record that names an anchor
  which does not exist, or a step that does not stand at the same
  anchor, is not a problem: the run then has no anchor, or no chain.
  Neither record carries a data format
  ([decision](decisions/data-format.md)): an engine that does not know
  them computes the same stations, runs and habits and shows the plan
  with the journey's own words.
- **Build choices** (`build:<runId>`, [game rules](game-rules.md) §7)
  are one record per run, rewritten as a whole when the user changes
  them (last writer wins); withdrawing it gives the journey's
  suggestion back. A name the engine does not know, or flowers on
  water, is ignored and the next default is used, so an older engine
  reading a newer list stays usable: the record changes only a
  picture, never what is computed, so it needs no data format of its
  own (#85).
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
- **Withdrawing a record** (undo an acceptance, remove an imported
  journey): write an empty string to its key.
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

### Data format and unknown data

The plugin and Pensum are released separately, so one may run a newer
engine than the other on the same records
([decision](decisions/data-format.md)).

- **Run-scoped keys:** every key except `journey:<id>`, `anchor:<id>` (and the old `settings`)
  names its run in the second part (`<kind>:<runId>:…`). Record kinds
  added later follow this, or are global and must not change what an
  older engine computes.
- **Data format:** the engine has a data format number (`DATA_FORMAT`,
  now `4`: `2` since checkpoints lost `xp` and `damage` in 3.3, `3`
  since stages can be skipped, #81, `4` since a stage can be left for
  the one before it, #82). A record carries the format that
  first gave it its meaning, not the engine's newest: a checkpoint stays
  `2`, so a run without a skip stays usable on a 3.3 host. A run-scoped
  record may carry `dataFormat: <n>`; a record without it is format 1. A newer engine writes `dataFormat` only on a
  record that changes what an older engine would compute for its run
  (a checkpoint, a skip, a real step back), and only then raises
  `DATA_FORMAT`.
  Everything else (new optional fields, new kinds an older engine may
  ignore) keeps its format. Withdrawing such a record lowers the run's
  format again. `format` on a `journey:` record is the story format, not
  this number.
- **Unknown kinds and fields:** the engine ignores record kinds and
  fields it does not know, without a problem. It never withdraws or
  rewrites them, and hosts keep every `questarc:` record they do not
  understand untouched when they write.
- **Read-only runs:** a run is read-only when one of its records has a
  `dataFormat` above the engine's ("written by a newer QuestArc"), when
  its journey is not available, or when the available journey has a
  lower `version` than the run's `journeyVersion`. The engine does not
  compute its stations; the view lists it in
  `readOnly` with the reason and a problem, and it keeps its place in
  the order of runs (active, paused, finished) from its `run`, `pause`
  and `run-end` records. Of a run in a newer format the engine reads
  nothing else, so a changed shape is not reported as a problem. A host
  shows a calm read-only page instead of the journey
  ([behaviour](behaviour.md), screen 4) and writes nothing for it.
- **Writing:** hosts pass every change through the engine's
  `guardWrite`, with the current view. If one key belongs to a
  read-only run or is of a kind this engine does not write, it refuses
  the whole change and names the refused keys, so an older host can
  neither add to a newer run nor withdraw a record it does not
  understand, and never writes half an action.

## 3. Engine output

The types are in `packages/engine/src/types/view.ts`; in short:

```ts
interface GameView {
  todayStr: string;
  active?: RunView; // the newest open run; absent when that run is read-only
  paused: RunView[]; // other open runs
  finished: RunView[]; // runs with a run-end record (the shelf)
  readOnly: ReadOnlyRun[]; // runs this engine cannot compute (§2)
  anchors: AnchorView[]; // the user's anchors with what stands at each (game rules §8)
  problems: string[]; // records and journeys the engine could not use
}

interface ReadOnlyRun {
  runId: string;
  journeyId: string;
  reason: 'newer-format' | 'journey-missing' | 'journey-version';
  state: 'active' | 'paused' | 'finished'; // its place among the runs
}

interface AnchorView {
  id?: string; // the anchor record; absent for journeys from before anchors
  kind: 'routine' | 'time';
  words?: string; // a routine, in the user's words: "getting up"
  time?: string; // a fixed time, "HH:MM"
  name?: string; // the name the user gave its place
  suggest?: string; // without id: the journey whose plan sentence suggests the words
  state: 'growing' | 'resting'; // growing: the active journey starts from here
  growing?: AnchorStep; // the active journey's current stage
  resting: AnchorStep[]; // open journeys that wait here
  steps: (AnchorStep & { state: HabitView['state'] })[]; // habits of finished journeys
  due: { runId: string; stageId: string; ask: 'weekly' | 'still' }[]; // questions due here
}

interface AnchorStep {
  runId: string;
  journeyId: string;
  stageId: string;
  after?: string; // the run of the step this one follows (a chain)
}

interface RunView {
  runId: string;
  journeyId: string;
  startDay: string;
  why?: string;
  // the anchor the run starts from, absent until the user has named one;
  // `after`: the step it follows instead of the anchor itself
  anchor?: {
    id: string;
    kind: 'routine' | 'time';
    words?: string;
    time?: string;
    after?: { runId: string; journeyId: string; stageId: string };
  };
  planCheck?: { wish?: string; outcome?: string; obstacle?: string; plan?: string };
  stations: StationView[];
  position: { stage: number; progress: number }; // current station, 0..1
  paused: boolean; // by a pause record or a paused repeat config
  checkinDue: boolean; // weekly question not answered this ISO week
  offerFallback: boolean; // second miss in a row, not yet followed by a completion
  offer?: ContinueOffer; // while the current stage is met (game rules §4)
  comeBack?: ComeBack; // the card after a long break is due (game rules §5)
  build: BuildView; // what the journey builds (game rules §7)
  answers?: WeeklyAnswers; // the current stage's weekly answers so far
  reminder?: ReminderView; // the current stage's task reminder, while it is followed
  habit?: HabitView; // a finished journey only: the habit it leaves (game rules §6)
}

interface WeeklyAnswers {
  // the latest 12 ISO weeks at most, oldest first, from the first
  // answered week to the latest answered one; a skipped week has no score
  weeks: { week: string; score?: number }[];
  // the latest answer against the latest one four or more weeks before
  // it: higher 'easier', equal 'same', absent when lower or without one
  trend?: 'easier' | 'same';
}

interface ReminderView {
  set: boolean; // the bound repeat gives its instances a reminder now
  time?: string; // with a reminder: the repeat's start time
  fade?: true; // with a reminder: two weekly answers of 5 or more in a row (game rules §9)
}

interface HabitView {
  stageId: string; // the journey's last stage
  state: 'maintained' | 'graduated' | 'unbound' | 'unsupported-repeat';
  checkinDue: boolean; // maintained: weekly question not answered this ISO week
  canGraduate: boolean; // maintained: the conditions of game rules §6 hold
  offerQuietUntil?: string; // it can, and the user said "Not Now": the offer is quiet before this day
  fourWeekly?: true; // not graduated: asked every four weeks now, no longer weekly
  answers?: WeeklyAnswers;
  graduated?: {
    day: string;
    choice: 'end' | 'keep'; // what the user does with the task
    checkDue?: string; // "does it still run by itself?" is due: its date
    suggestBack?: true; // the latest answer was "not really"
  };
  backDay?: string; // not graduated any more: the day it was last brought back
  // maintained only (#66): the last stage's run carried on past the
  // journey's end, and its last 7 due or paused days, oldest first
  run?: { current: number; best: number; total: number; gap: boolean };
  lastDays?: { day: string; mark: 'done' | 'gap' | 'open' | 'paused' }[];
  reminder?: ReminderView; // maintained only: the reminder of the habit's task
}

interface ContinueOffer {
  suggest: 'continue' | 'stay' | 'none'; // from the latest weekly answer
  answer?: number; // that answer, 1..7
  quietUntil?: string; // the user stays: the offer is quiet before this day
}

interface ComeBack {
  from: string; // the first day of the gap
  smaller?: string; // the finished stage before, which "Start Smaller" makes current again
}

interface BuildView {
  ladder: string; // a ladder in content/art/ (<name>.ladder.json)
  version: number; // 1 + finished and skipped stages
  skipped: number[]; // standing versions that came from a skipped stage
  versions: number; // stages + 1
  marker: string; // what hangs: lanterns, bunting, flowers (markers.json)
  hue: string; // a name from the list's hues
  markerProgress: number; // 0..1, the stage's highest condition progress so far
  ready: boolean; // the current stage is met now
}

interface StationView {
  stageId: string;
  state: 'done' | 'skipped' | 'met' | 'current' | 'unbound' | 'unsupported-repeat' | 'ahead';
  progress: number; // 0..1
  run: { current: number; best: number; total: number; gap: boolean };
  completions: number; // days with a counting completion
  welcomeBacks: number;
  acceptedDay?: string;
  doneDay?: string;
  skippedDay?: string; // a skipped stage ("already yours")
  undoable?: boolean; // a skipped stage whose skip can still be taken back
  pair?: string; // what the user pairs the stage with, in their words
  stepBackDay?: string; // a finished stage walked again after a step back: since this day
  leftDay?: string; // the stage left by a step back (state `ahead`): since this day
  // current stage only: the last 7 due or paused days, oldest first
  lastDays?: { day: string; mark: 'done' | 'gap' | 'open' | 'paused' }[];
}
```

When the user accepts the next stage, the host writes the checkpoint
record with the day (`continueJourney`, which also takes the stage's
pairing along); staying writes `stayHere`,
"I already do this" `skipStage`, taking it back `undoSkip`. Each returns
no changes when the view does not allow the action (not met, a stage
with a task, the last stage, a skip that is no longer undoable). The
card after a long break writes `carryOn`, `callItAPause` or `stepBack`;
each returns no changes while `comeBack` is absent, and `stepBack`
also without `comeBack.smaller`. For the habit of a finished journey
the weekly answer is the same `answerCheckin` with the last stage;
`graduate`, `graduateLater`, `answerStill` and `bringBack` take the
finished run and return no changes when its `habit` does not allow them. For anchors,
`nameAnchor` returns no changes without usable words or a time,
`confirmAnchor` without a group of journeys from before anchors, and
`removeAnchor` while something stands at the anchor.

`diff(before, after)` returns events `{ key, params }` for toasts:
`event.completion`, `event.welcome-back`, `event.progress-summary` (more
than one new completion at once, e.g. after a sync),
`event.station-reached`, `event.fallback-offered`,
`event.build-element` (`{ from, to }`: the marker
progress rose) and `event.build-version` (`{ version }`).
The habit of a finished journey has no events: that it can graduate is
shown in the view only, and a graduated habit produces no messages. All numbers follow the
[game rules](game-rules.md).

## 4. Pensum

Pensum reads the same records from its dataset:

- `pluginUserData` entries with ids `questarc:<key>`; values of 1024 or
  more characters are stored as `GZ1:<base64 gzip>` and must be decoded.
- To write a record, Pensum passes the changes through `guardWrite`
  (`engine-cli.mjs`, `{ "guardWrite": … }`), adds or replaces those
  entries, encoded the same way, and keeps every other entry untouched,
  also `questarc:` entries it does not understand (§2, data format). `pensum.store.validate`
  must stay empty.
- Pensum builds the snapshot from its tasks, archives and
  `taskRepeatCfg` slice, runs the engine through gjs
  ([engine in gjs](decisions/engine-in-gjs.md)) and creates repeat
  configs with its own repeating-task code.
