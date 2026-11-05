---
type: Concept
title: Game rules
description: The exact rules and numbers the engine implements for both hosts: what counts, due days and misses, runs, stage conditions, XP, level, welcome back, guardians, HP, graduation and calm mode, with worked examples.
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

- Days are Super Productivity's logical days (`todayStr` and the
  day-start offset from `getDayContext()`).
- A **due day** is a day on which the bound recurring task was scheduled
  by its repeat config. How due days are computed for each repeat
  setting is specified in issue #48. Days that are not due never count
  as misses.
- A completion counts for the day its instance was due (taken from the
  instance id `rpt_<cfgId>_<day>`, or `created`), not the day it was
  ticked off. **Backfill window:** a completion counts for its due day if
  it was ticked off by the end of the next logical day; later ones count
  for the day they were ticked off.
- **Paused days** (between a pause and a resume record) are not due.
- A due day is **missed** when it is over and has no counting completion.

## 3. Runs: never miss twice

- A **run** is a stretch of due days in which no two consecutive due days
  are missed. One missed due day is a gap inside the run; a second missed
  due day in a row ends the run.
- The engine reports per stage: the current run (completed due days in
  it), the best run, the total completions, and whether the current run
  has an open gap.
- After the run ends (second miss in a row), the engine sets
  `offerFallback`: the previous, smaller stage is offered for hard days.
  Nothing else happens.

**Example A.** Due daily. Days 1–4 done, day 5 missed, days 6–7 done:
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

Only due days since the stage was accepted are looked at. Progress for
the journey view: `days` → completions in the window ÷ n (capped at 1);
`count` → completions ÷ n; `time_spent` → minutes ÷ n.

**Example B.** `days` 5 of 7, due daily, stage accepted on day 1. Days
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

**Example C.** Example A's stage: 6 completions × 10 = 60 XP, plus 10 for
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

**Example D.** Guardian HP 100 in Example A's stage: 70 damage after day 7. Day 10 is the first completion after the misses: 10 + 10 welcome back
= 90. Day 11: 100, the guardian is defeated.

## 7. HP (RPG mode only)

- **HP = 100 − 20 × (number of run-ending second misses in the last 7
  logical days)**, minimum 0.
- HP recovers by itself as those days leave the 7-day window. HP 0 has no
  consequence other than how it looks; nothing is lost.
- Calm mode has no HP.

## 8. Graduation

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

## 9. Calm mode

Calm mode hides XP, level, guardians and HP and uses no game words. It
shows the path, the stations, the current and best run, the conditions,
the welcome-back text and the weekly question. Switching modes changes
only what is shown; the engine computes the same values in both.
