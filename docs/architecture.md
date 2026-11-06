---
type: Concept
title: Architecture of QuestArc 3.0
description: One pure game engine, two native hosts (Super Productivity plugin, Pensum), game state derived from task data, only user choices stored; the prototypes it builds on, risks and the owner's decisions.
tags: [architecture, engine, super-productivity, pensum, decisions]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Architecture of QuestArc 3.0

QuestArc 3.0 is written from scratch. It turns habits into journeys
([roadmap](roadmap.md#the-journey)), following the rules in
[psychology](psychology.md). The same game runs in two hosts:

- as a plugin inside [Super Productivity](https://super-productivity.com);
- as a game page inside Pensum, the native Phosh app that works on Super
  Productivity's data.

The milestones are in the [roadmap](roadmap.md); Super Productivity's
plugin API and data are described in
[Super Productivity facts](super-productivity-facts.md).

## Where the ideas come from

Four prototypes of the same idea exist. 3.0 takes their ideas, not their
code; the prototypes stay readable in git history (QuestArc 2.x up to
commit `8ec9137`) and on Codeberg (GoVenture, HeroicRPG).

| Prototype                | Idea kept                                                                                                                                      | Mistake not repeated                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GoVenture (PWA)          | Calm mode by default, RPG opt-in; level only cosmetic; habit journey ending with keep or archive                                               | Event replay that applied HP again on every recompute; punishing fail severities (gold loss, boss heals)                      |
| HeroicRPG (SP plugin)    | A stage is a harder version of the same habit; the next stage starts only when the user accepts it; pluggable conditions (streak, count, time) | A "streak" that never checked consecutive days                                                                                |
| QuestArc 2.x (SP plugin) | Stories with bosses, streaks with grace, habit stacking                                                                                        | Game state in task titles and notes; reopening and renaming the user's tasks and projects; XP counted up and never recomputed |
| Pensum (Phosh)           | Native GTK app on Super Productivity's backup format that keeps unknown data (incl. `pluginUserData`) exactly                                  | —                                                                                                                             |

## Structure

```
                QuestArc repository
 ┌───────────────────────────────────────────────┐
 │ docs/      psychology, game rules, behaviour  │
 │ content/   journeys (JSON), texts (i18n JSON) │
 │ packages/engine/  pure TypeScript game engine │
 │                   + shared test vectors       │
 └──────────────┬──────────────────┬─────────────┘
                │                  │
   Super Productivity plugin      Pensum  pensum/game/
   adapter + UI in SP's look      adapter + GTK/libadwaita UI
                │                  │
                └── Super Productivity data and sync ──┘
```

## Rules that hold everywhere

1. **Derive, don't count.** XP, level, guardian HP, stage progress and
   streaks are computed from task data on every evaluation. Two devices
   with the same data show the same game, and nothing is lost when sync
   merges.
2. **Store only choices.** QuestArc stores what the user decided: which
   journey runs, which stage was accepted and when, which task is bound to
   a stage, settings. Nothing that can be computed.
3. **The user's tasks stay the user's.** No markers in titles, no JSON in
   notes, no renamed projects, no reopened tasks. QuestArc changes tasks
   only when the user asks for it.
4. **One engine.** All game decisions are in `packages/engine`. Hosts
   collect input, call the engine and draw its output.
5. **Native look per host.** The plugin follows Super Productivity's theme;
   Pensum follows libadwaita and the Phosh rules (360 px, touch). Same
   screens, texts and behaviour; different widgets.

## The engine

- **Input:** a snapshot of tasks (active and archived), repeat configs,
  tags and projects; QuestArc's choice records; the journey definitions;
  the logical day (`todayStr`) and day-start offset, which Super
  Productivity gives plugins through `getDayContext()`.
- **Output:** a `GameView` (level, journeys with station states, condition
  progress, guardian HP, streaks, habits that may graduate) and the events
  between two views, for toasts.
- **Pure:** no clock, no machine time zone, no logging, no global state.
  Same input, same output, in the browser and in GJS.
- **Build:** one dependency-free ES module plus a command-line wrapper.
  Pensum pins a QuestArc release in its Flatpak manifest and uses only
  these files.
- **Test vectors:** JSON input → expected `GameView`, run in Node and in
  GJS, and by Pensum's CI.

## Where data lives

| Data                                                               | Where                                                                 | Why                                                                                                                                                              |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tasks, done dates, time spent, repeat configs                      | Super Productivity's normal data                                      | Already synced and shown by both hosts                                                                                                                           |
| Built-in journeys                                                  | `content/journeys/*.json`, shipped in the plugin and pinned in Pensum | Same content in both hosts; others add journeys by pull request ([decision](decisions/journeys-by-pull-request.md))                                              |
| Private journeys (later, #40)                                      | QuestArc plugin data                                                  | Synced with the user's data; the same file as a published journey                                                                                                |
| Choices (journey started, stage accepted, task bindings, settings) | QuestArc plugin data, **one key per record**                          | Each key is its own `pluginUserData` entry, resolved per entry, so two devices adding records do not overwrite each other ([facts](super-productivity-facts.md)) |
| Everything computable                                              | Nowhere                                                               | Rule 1                                                                                                                                                           |

## Running the engine in Pensum

Pensum is Python. It starts `gjs -m engine-cli.mjs` from the GNOME
runtime, passes the snapshot as JSON on stdin and reads the `GameView`
from stdout: no new dependency, no second implementation. This needs
proof first (spike issue): `gjs` in `org.gnome.Platform//51`, and a start
time on the phone that does not slow Pensum down. If the spike fails, a
Python port must pass the same test vectors.

## Game rules

The exact rules and numbers are in [game rules](game-rules.md) (decided
2026-11-05, #11): only the current stage's task counts, 10 XP per
completion and 10 for a welcome back, cosmetic levels, never miss twice
over due days with a one-day backfill window, guardians worn down by the
stage's XP, HP only in RPG mode and self-recovering, graduation by three
high weekly answers, 80 % completion and reminders already off. Not
planned: gold and shop, random rewards, login bonuses, leaderboards,
money commitments.

## Risks

Found when the plan was reviewed; each has an issue in the first
milestones.

- **Plugins cannot create recurring tasks.** Accepting a stage should set
  up a recurring task, but the plugin API offers no way to create a repeat
  config ([facts](super-productivity-facts.md)). Decided:
  [recurring-task setup](decisions/recurring-task-setup.md).
- **Missed days leave no data.** Super Productivity creates an instance
  only on days a recurring task is due, so the engine computes due days
  itself. Decided: only daily, every n days and chosen weekdays are
  allowed for a stage ([game rules](game-rules.md#due-days-issue-48)).
- **Repeat data is subtler than it looks** ([facts](super-productivity-facts.md)):
  at most one instance per config is created, for the newest occurrence;
  with `skipOverdue` (on by default for simple schedules) past instances
  are skipped or deleted; archiving clears `dueDay`, so the day comes from
  the instance id (`rpt_<cfgId>_<day>`) or `created`; deleting a repeat
  config clears `repeatCfgId` on all its tasks, so a stage must not be
  bound by `repeatCfgId` alone; "won't do" tasks are `isDone` too and must
  not count.
- **Newest plugin API not released yet.** `getDayContext`, `dataChanged`
  and `dayChange` came after 19.3.1, and the npm package of the API types
  is from 2025. QuestArc either waits for the release or falls back for
  older versions; the types come from the pinned upstream commit.
- **Compressed plugin data.** Super Productivity stores long plugin data
  as `GZ1:` plus gzip in the backup; Pensum must decode it.
- **Deleting history changes the game.** If archived tasks or single
  instances are deleted, derived XP and progress drop. Decided: finished
  stages are kept as checkpoints ([deleted history](decisions/deleted-history.md)).
- **Large archives.** Every evaluation reads the whole archive; with years
  of data the GJS route in Pensum may become slow.
- **Testing in the real host.** Unit tests do not show whether the plugin
  works inside a running Super Productivity; a test in the real app is
  needed.

## Decisions (owner, 2026-11-05)

| #   | Question                   | Decision                                                                                                                                                                                                         |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Others using QuestArc 2.x? | Probably nobody; clean break                                                                                                                                                                                     |
| D2  | What is a habit?           | Super Productivity's recurring tasks (`taskRepeatCfg`); its habit counters do not fit                                                                                                                            |
| D3  | Keep HP?                   | Only in RPG mode, derived from the last 7 days, recovers by itself                                                                                                                                               |
| D4  | Gold and shop?             | Dropped for now                                                                                                                                                                                                  |
| D5  | Planning?                  | GitHub issues and milestones as in the other apps; goals in the [roadmap](roadmap.md)                                                                                                                            |
| D6  | Phosh toolkit rules?       | Only English, knowledge in `docs/`, pinned dependencies, pull requests and CI; not the GTK and Flatpak rules                                                                                                     |
| D7  | GoVenture and HeroicRPG?   | Archive on Codeberg with a note pointing here                                                                                                                                                                    |
| D8  | Build on 2.x code?         | No: start from scratch and work only from these documents; 2.x stays in git history; no import of 2.x quests                                                                                                     |
| D9  | Journey                    | Progress shown as travel along a path, QuestArc's own design ([roadmap](roadmap.md#the-journey))                                                                                                                 |
| D10 | Journeys at once           | One active journey; it can be paused to start another                                                                                                                                                            |
| D11 | Habits after a journey     | They stay: QuestArc never deletes or ends a recurring task; graduation is offered by automaticity, the user decides                                                                                              |
| D12 | Evidence-based rules       | The [design rules](psychology.md) follow the [evidence review](research.md); no telemetry, so no A/B tests and success shown only to the user; a supporter digest needs sharing and waits with cooperation (#45) |
| D13 | Licence                    | AGPL-3.0-or-later, © 2026 suitably, like the other apps; Pensum (also AGPL) can include the engine without a compatibility question; Super Productivity sets no licence rules for plugins                        |
