# Implementation Plan - Task 111

**Goal:** Turn QuestArc into one shared game engine with two native hosts: the
Super Productivity plugin and a game page in Pensum, the native Phosh app on
the same Super Productivity data.

This is the master plan. Each phase below becomes its own task folder
(`docs/<ID>/`) and GitHub issues when it starts.

## ⚠️ User Review Required

> [!IMPORTANT]
> Decisions are recorded in [Decisions](#5-decisions-owner-2026-11-05).
> Phase 3 changes where QuestArc keeps its data. Stories started with 2.x
> need a migration or a clean break (decision D1).

## 1. Starting point

Four prototypes of the same idea exist. What each brings:

| Prototype                | Best idea to keep                                                                                                                                          | What not to repeat                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GoVenture (PWA)          | Calm mode by default, RPG opt-in; level only cosmetic (its D-003); numbers in `BALANCING.md`; habit journey ending with keep/archive                       | Event replay that was not idempotent (HP applied again on every recompute); punishing fail severities (gold loss, boss heals) |
| HeroicRPG (SP plugin)    | A stage is a harder version of the same habit; the next stage starts only when the user accepts it; pluggable stage conditions (streak, count, time spent) | "Streak" that never checked consecutive days                                                                                  |
| QuestArc 2.x (SP plugin) | Working plugin with stories, bosses, streaks with grace, habit stacking; SolidJS UI; release ZIP build                                                     | Game state in task titles and notes; reopening and renaming the user's tasks and projects; XP counted up and never recomputed |
| Pensum (Phosh)           | Native GTK app on Super Productivity's backup format, keeps unknown slices (incl. `pluginUserData`) exactly                                                | —                                                                                                                             |

State of QuestArc today (2026-11-05, commit `8ec9137`):

- About 3.6k lines of logic and 4.1k lines of UI; about 2.1k lines of the
  logic are already pure (`src/lib/`).
- 123 tests, of which 23 fail; `tsc --noEmit` reports 48 errors; CI only
  builds the release ZIP on tags and runs no tests.
- Game state is spread over three places: the plugin blob (XP, level,
  settings), the notes JSON of each quest task (progress, streak, grace,
  boss HP, undo history) and markers in titles and project names
  (`🧭`, `(n/N)`, `3/7 🔥`, `HP`).
- The plugin writes into the user's data often: it renames projects,
  rewrites titles and notes after every completion, reopens done tasks,
  and replaces root task notes with undo JSON (prose notes are lost).

## 2. Target architecture

```
                QuestArc repository
 ┌───────────────────────────────────────────────┐
 │ docs/      psychology, game rules, behaviour  │
 │ content/   stories (JSON), texts (i18n JSON)  │
 │ packages/engine/  pure TypeScript game engine │
 │                   + shared test vectors       │
 └──────────────┬──────────────────┬─────────────┘
                │                  │
   src/  Super Productivity       Pensum  pensum/game/
   plugin: adapter + SolidJS UI   adapter + GTK/libadwaita UI
   (SP's look)                    (runs the engine in GJS)
                │                  │
                └── Super Productivity data and sync ──┘
```

### 2.1 Rules that hold everywhere

1. **Derive, don't count.** XP, level, boss HP, stage progress and streaks
   are computed from the task data on every evaluation. Two devices with
   the same data show the same game, and nothing is lost when sync merges.
2. **Store only choices.** QuestArc stores only what the user decided:
   which story runs, which stage was accepted and when, which task is bound
   to a stage, settings. Nothing that can be computed.
3. **The user's tasks stay the user's.** No markers in titles, no JSON in
   notes, no renamed projects, no reopened tasks. QuestArc writes to tasks
   only when the user asks for it (accepting a stage creates that stage's
   task or repeat config).
4. **One engine.** All game decisions are in `packages/engine`. Hosts
   collect input, call the engine, and draw its output.
5. **Native look per host.** The plugin follows Super Productivity's theme;
   Pensum follows libadwaita and the Phosh rules (360 px, touch). Same
   screens, texts and behaviour; different widgets.

### 2.2 The engine

- **Input:** a snapshot (tasks incl. archived ones with `doneOn` and
  `timeSpentOnDay`, repeat configs, habits/counters if used, projects,
  tags), QuestArc's stored choices, the story definitions, `today` as a day
  string and Super Productivity's day-start offset.
- **Output:** a `GameView`: level and XP, active story with current stage,
  stage progress and condition state, boss HP, streaks with "never miss
  twice" state, graduated habits, and a list of _events since a given
  snapshot_ (for toasts: "Boss takes 30 damage", "Stage complete").
- **Pure:** no `Date.now()`, no time zone of the machine, no logging, no
  global state (today `cron.ts` holds static aliases; `StreakLogic` reads
  the clock). Same input, same output, in the browser and in GJS.
- **Build:** one dependency-free ES module (`engine.mjs`) plus types.
  Pensum pins a QuestArc tag in its Flatpak manifest and loads only this
  file, as it does with phosh-toolkit.
- **Test vectors:** `packages/engine/vectors/*.json` (input snapshot →
  expected `GameView`). The engine's own tests run them; Pensum runs the
  same vectors through GJS in its CI to prove the build behaves the same.

### 2.3 Where data lives

| Data                                                             | Where                                                                    | Why                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tasks, done dates, time spent, repeat configs                    | Super Productivity's normal data                                         | Already synced and shown by both hosts                                                                                                                                                                                                                                                                                                                                  |
| Story definitions (built-in)                                     | `content/stories/*.json`, shipped in the plugin ZIP and pinned in Pensum | Same content in both hosts                                                                                                                                                                                                                                                                                                                                              |
| Story definitions (user-made)                                    | QuestArc plugin data                                                     | Created in the plugin UI                                                                                                                                                                                                                                                                                                                                                |
| Choices (story started, stage accepted, task bindings, settings) | QuestArc plugin data, **one key per record**                             | `persistDataSynced(data, key)` stores each key as its own `pluginUserData` entry `<pluginId>:<key>` that resolves conflicts per entry (last writer wins), so two devices adding different records do not overwrite each other (Super Productivity `src/app/plugins/util/plugin-persistence-key.util.ts`, commit `25cce3b`). Today QuestArc uses one blob without a key. |
| Everything computable                                            | Nowhere                                                                  | Rule 1                                                                                                                                                                                                                                                                                                                                                                  |

Pensum already keeps `pluginUserData` untouched. To _write_ choices (e.g.
accept a stage on the phone) Pensum must follow the same record format;
until then it is read-only.

### 2.4 Running the engine in Pensum

Pensum is Python. It starts `gjs -m engine-cli.mjs` from the GNOME runtime,
passes the snapshot as JSON on stdin and reads the `GameView` from stdout.
No new dependency, no second implementation. Needs proof (Phase 2 spike):
`gjs` present in `org.gnome.Platform//51`, start time on the phone
acceptable (target below 300 ms for a typical dataset). Fallback if the
spike fails: a Python port that must pass the same test vectors.

## 3. Game rules (draft for Phase 1)

Taken from the prototypes and the [psychology](../psychology.md) rules.
Numbers are starting points for balancing, not final.

- **XP per completed task:** `10 + round(7 * sqrt(minutes))`, where
  `minutes` is time spent, else the estimate, else 0; capped at 120 minutes
  per task. The square root is GoVenture's focus formula: longer work
  counts more, but not linearly.
- **Level:** `floor(sqrt(totalXp / 50)) + 1` (GoVenture). Cosmetic only:
  it unlocks titles and themes, never power (GoVenture D-003).
- **Stories:** linear stages. Each stage has a habit or task, an anchor
  ("after …"), a condition (`days` within a window, `count`,
  `time_spent`), optional boss, and story text. The next stage starts when
  the user accepts it (HeroicRPG).
- **Never miss twice:** a single missed day keeps a streak; two missed
  days in a row end it, and the stage condition counts days done within a
  window (e.g. 5 of the last 7) instead of an unbroken run.
- **Boss:** fixed HP per stage; damage is the XP of tasks bound to the
  story since the stage was accepted. Derived, so no healing and no
  replay.
- **HP (RPG mode, optional):** derived from the last 7 days only. Every
  second consecutive miss costs HP; HP recovers by itself as the window
  moves. No death, no gold loss.
- **Graduation:** a habit done in ≥ 90 % of days over its stage's last 30
  days can graduate: it leaves the daily list (repeat stays or ends, user
  chooses — GoVenture's keep/archive) and goes to a trophy shelf.
- **Out for now:** gold and shop (spending is accumulated state), random
  rewards, login bonuses, leaderboards, parties (need a server).

## 4. Phases

Each phase ends with something usable and green CI.

### Phase 0 – Move and stabilise (QuestArc 2.x stays as it is)

- GitHub Actions: build, lint, typecheck, tests on every pull request;
  release ZIP on tags (replaces `.woodpecker.yml`).
- Make the existing 123 tests pass and `tsc` clean, without changing
  behaviour; fix the undo bug that replaces prose notes.
- Fix links (manifest homepage, README), versions in `package.json` and
  `manifest.json`, the out-of-date docs (README XP formula,
  `TECHNICAL_CONCEPT.md`).
- Tags and releases on GitHub (owner pushes tags; see below).

### Phase 1 – Specification (documents only)

- `docs/psychology.md` (added with this plan).
- `docs/game-rules.md`: formulas, conditions, never miss twice, boss, HP,
  graduation, with worked examples.
- `docs/data-model.md`: snapshot input, stored choice records, story format
  v3, migration from 2.x.
- `docs/behaviour.md`: screens, flows, texts and actions, host-neutral,
  with the mapping to both hosts (header button / header bar, side panel /
  sidebar page, task context menu / row menu, snack / toast).
- Verify in Super Productivity's source: what `getArchivedTasks` returns
  (all archived tasks with `doneOn`?), whether plugins can read the
  day-start offset, and how repeat configs are exposed.

### Phase 2 – Engine

- Spike first (one session): a minimal engine (XP from done tasks) runs in
  the plugin and through `gjs` inside the GNOME 51 runtime; measure start
  time.
- `packages/engine`: move the pure parts of `src/lib` in, remove clock and
  global state, implement the game rules, write test vectors.
- Build `engine.mjs` and `engine-cli.mjs`; publish them with each release.

### Phase 3 – Plugin 3.0 on the engine

- Plugin adapter: collect snapshot via the plugin API, store choice
  records, call the engine, show events as snacks.
- UI rebuilt from `docs/behaviour.md` with SP's theme variables; header
  XP via `registerHeaderButton` instead of DOM injection if possible.
- Remove title markers, notes JSON, project renames, task reopening.
- Migration from 2.x (or clean break, D1).

### Phase 4 – Content

- Built-in stories in `content/stories/` (e.g. morning routine, walking
  habit, deep work), written along the psychology rules.
- Texts in `content/i18n/en.json` (German later), used by both hosts.

### Phase 5 – Pensum game page (in Pensum's repository)

- Starts only when Pensum's current milestone is done; until then an issue
  in Pensum's backlog.
- Read-only first: game page, level in the header, toasts after
  completing tasks, game layer switch in preferences.
- Then writing: accept a stage, bind a task, using the same choice
  records.

### Later

Companions (cosmetic, from consistency of a tag), focus sessions as a
stage condition (time spent is already in the data), story editor and
sharing of story JSON, cooperation if a serverless way exists.

## 5. Decisions (owner, 2026-11-05)

| #   | Question                   | Decision                                                                                                                    |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| D1  | Others using QuestArc 2.x? | Probably nobody (2.x is not working well and was untouched for months): clean break, one-time import of a running story     |
| D2  | What is a habit?           | Super Productivity's recurring tasks (`taskRepeatCfg`); its habit counters do not fit                                       |
| D3  | Keep HP?                   | Only in RPG mode, derived from the last 7 days, recovers by itself                                                          |
| D4  | Gold and shop?             | Dropped for now                                                                                                             |
| D5  | Planning?                  | GitHub issues and milestones as in the other apps; `docs/<ID>/` keeps plans and worklogs; goals in [roadmap](../roadmap.md) |
| D6  | Phosh toolkit rules?       | Only English, knowledge in `docs/`, pinned dependencies, pull requests and CI; not the GTK and Flatpak rules                |
| D7  | GoVenture and HeroicRPG?   | Archive on Codeberg with a note pointing here                                                                               |

The owner also wants a journey like in other habit RPGs: progress shown
as travel along a path. It is designed in the [roadmap](../roadmap.md#the-journey).

## 🧪 Verification

This plan changes no code. It is checked by the owner's review of the
decisions above.
