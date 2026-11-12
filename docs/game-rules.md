---
type: Concept
title: Game rules
description: The exact rules and numbers the engine implements for both hosts: what counts, due days and misses, runs, stage conditions, XP, level, welcome back, guardians, graduation and calm mode, with worked examples.
tags: [game-rules, engine, numbers]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Game rules

Decided by the owner on 2026-11-05 (issue #11). These rules turn the
[design rules](psychology.md) into numbers. The engine implements them;
the plugin and Pensum only show the result. Every worked example below
becomes a test vector. The numbers are starting points that may be tuned
once the owner has used them; changing a number means changing this file
and its test vectors together.

## 1. What counts

- **Only the current stage's task counts.** A completion counts when it
  is an instance of the recurring task bound to the active journey's
  current stage ([recurring-task setup](decisions/recurring-task-setup.md)).
  Other tasks give nothing, in calm and in RPG mode: progress shown is
  progress on the habit.
- A task finished as "won't do" (`wontDoOn === doneOn`) does not count.
- **One active journey** at a time; it can be paused to start another.

## 2. Days

### Logical days

- Days are Super Productivity's logical days. The engine gets
  `todayStr`, the day-start offset `startOfNextDayDiffMs` (both from
  `getDayContext()`) and the user's IANA time zone as input.
- The logical day of a timestamp `t` is the calendar date of
  `t − startOfNextDayDiffMs` in that time zone (`Intl.DateTimeFormat`,
  which Node and gjs both support with the same results). Daylight-saving
  changes are handled by the time zone database, never by adding 24 hours.

### Due days (issue #48)

A stage may only be bound to a recurring task whose schedule QuestArc can
compute exactly. Supported repeat configs:

| Schedule        | Repeat config                                              | Due days                                                 |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| Daily           | `repeatCycle: DAILY`, `repeatEvery: 1`                     | every day                                                |
| Every n days    | `repeatCycle: DAILY`, `repeatEvery: n` (2–7)               | `startDate` + k·n days                                   |
| Chosen weekdays | `repeatCycle: WEEKLY`, `repeatEvery: 1`, `monday`…`sunday` | the marked weekdays (Monday to Friday is one case of it) |

Everything else (monthly, yearly, every n weeks, `repeatFromCompletionDate`,
`waitForCompletion`) is not offered for a stage: the stage dialog asks
for one of the supported schedules. Habits that happen less than weekly
are not what journeys are for.

A day `d` is due when all of these hold:

1. `d` is on or after the day the stage was accepted, on or after the day
   its task was bound (the binding record's `day`: the station waits
   until it has a task, so days before are neither due nor missed), on or
   after the config's `startDate`, and on or before `repeatUntilDay` if set;
2. the schedule above has an occurrence on `d`;
3. `d` is not in the config's `deletedInstanceDates` (the user skipped
   that occurrence in Super Productivity's repeat dialog: a planned skip,
   not a miss);
4. `d` is not inside a pause (below).

### Pauses

- A QuestArc pause (pause and resume records) makes its days not due.
- A **paused repeat config** in Super Productivity (`isPaused`) carries no
  dates. When a host sees the bound config change between paused and not
  paused, it writes a pause or resume record for that day. While the
  config is paused and no record says since when, the days after the last
  counting completion are treated as paused. Both rules err on the side of
  the user: a pause never turns into misses.

### Which day a completion counts for

- An instance with an id `rpt_<cfgId>_<YYYY-MM-DD>` belongs to that day.
  The first task of a config (an existing task turned into a recurring
  one) has its own id: it belongs to its `dueDay` if present, otherwise to
  the logical day of `doneOn`. Archived tasks have no `dueDay`, so the id
  is the main source.
- **Backfill window:** a completion counts for its due day if it was
  ticked off (`doneOn`) by the end of the next logical day. A later
  completion counts for the logical day it was ticked off.
- A completion on a day that is not due still counts (XP, `count`,
  `time_spent`, guardians) and ends a series of misses, but does not
  lengthen a run.
- **At most one completion counts per day**, also when two instances of
  the task were ticked off for the same day.
- Deleting a done instance removes its completion; finished stages are
  protected by checkpoints ([deleted history](decisions/deleted-history.md)).

### Missed days

A due day is **missed** when the backfill window for it has passed (the
end of the next logical day) and it has no counting completion. Today and
yesterday are therefore never missed yet.

**Example A.** Chosen weekdays Monday, Wednesday, Friday. The user does
Monday, misses Wednesday, does Friday: one gap, the run continues and
Friday is a welcome back. The next week they do Monday, then miss
Wednesday and Friday: those are consecutive due days, so the run ends;
Tuesday and Thursday never counted.

**Example B.** Daily, day start 04:00, time zone Europe/Berlin. A walk
ticked off at 01:30 on Tuesday belongs to Monday's logical day. Monday's
instance ticked off on Tuesday evening still counts for Monday
(backfill); ticked off on Wednesday it counts for Wednesday.

## 3. Runs: never miss twice

- A **run** is a stretch of due days in which no two consecutive due days
  are missed. One missed due day is a gap inside the run; a second missed
  due day in a row ends the run.
- The engine reports per stage: the current run (completed due days in
  it), the best run, the total completions, and whether the current run
  has an open gap.
- After the run ends (second miss in a row), the engine sets
  `offerFallback`: the user is told that on hard days doing the previous,
  smaller stage's action and ticking off the task counts as a completion
  ([behaviour](behaviour.md), flow D). No task or record changes; nothing
  else happens.

**Example C.** Due daily. Days 1–4 done, day 5 missed, days 6–7 done:
current run 6 completions, one gap, best run 6. Day 8 and 9 missed: the
run ends with 6, `offerFallback` is set, best run stays 6, total 6.

## 4. Stage conditions

A stage is **met** when its condition holds; it then waits for the user
to accept the next stage. Conditions (from the story format):

| Condition      | Meaning                                                   | Default |
| -------------- | --------------------------------------------------------- | ------- |
| `days` n of m  | completions on at least n of the last m due days          | 5 of 7  |
| `count` n      | at least n completions since the stage was accepted       | —       |
| `time_spent` n | at least n minutes tracked on the stage's task since then | —       |

Only due days since the stage was accepted (and its task bound) are looked at. Progress for
the journey view: `days` → completions in the window ÷ n (capped at 1);
`count` → completions ÷ n; `time_spent` → minutes ÷ n.

**Example D.** `days` 5 of 7, due daily, stage accepted on day 1. Days
1, 2, 4, 5, 6 done, 3 and 7 missed: the last 7 due days hold 5
completions → met on day 6.

## 5. XP and level

- **10 XP per counting completion.** Fixed; not based on time spent or
  estimates (the evidence review advises against tying rewards to
  performance measures).
- **Welcome back:** the first counting completion after a missed due day
  earns 10 extra XP and triggers the welcome-back event. At most once per
  gap.
- XP is shown after a completion, never announced beforehand (no "do
  this for 10 XP" labels), because announced rewards undermine interest
  in things people already enjoy.
- **Level** = `floor(sqrt(totalXp / 50)) + 1`: level 2 at 50 XP (5
  completions), level 5 at 800 XP (80), level 10 at 4,050 XP (about 400).
  Levels are cosmetic only: each unlocks a title or a look, never power.
- **Total XP** = XP from the checkpoints of finished stages
  ([deleted history](decisions/deleted-history.md)) + XP derived for the
  current stage.

**Example E.** Example C's stage: 6 completions × 10 = 60 XP, plus 10 for
the welcome back on day 6 = 70 XP → level 2.

## 6. Guardians

- A stage may have a guardian with HP (story format; default 100).
- **Damage** = the XP earned in the stage since it was accepted
  (completions and welcome-back bonuses). The guardian is defeated when
  damage ≥ HP. Damage never goes back up after a checkpoint, and
  guardians never heal.
- A guardian is an extra, not a condition: the stage is met by its
  condition; an undefeated guardian simply stays on the path and can be
  defeated later in the stage.

**Example F.** Guardian HP 100 in Example C's stage: 70 damage after day 7. Day 10 is the first completion after the misses: 10 + 10 welcome back
= 90. Day 11: 100, the guardian is defeated.

## 7. Graduation

A habit **qualifies** for graduation when all of these hold:

- the last 3 weekly automaticity answers ("… is something I do
  automatically", 1–7) are each 6 or 7, from 3 consecutive weeks;
- completions on at least 80 % of due days over the last 28 logical days;
- reminders have been off (or never set) for at least 14 days, and
  completion did not fall below 80 % in that time.

The user then chooses: keep the task repeating quietly, or end the
repeat in Super Productivity. QuestArc asks the weekly question again 2
and 6 weeks after graduation; an answer of 4 or less, or completion below
60 % in the 2 weeks before, suggests bringing the habit back (one tap).

## 8. Calm mode

Calm mode hides XP, level and guardians and uses no game words. It
shows the path, the stations, the current and best run, the conditions,
the welcome-back text and the weekly question. Switching modes changes
only what is shown; the engine computes the same values in both.
