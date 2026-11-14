---
type: Concept
title: Game rules
description: The exact rules and numbers the engine implements for both hosts: what counts, due days and misses, runs, stage conditions, staying, skipping and stepping back, welcome back and the card after a long break, graduation and the build of a journey (ladder, version, marker progress, ready), with worked examples.
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
  Other tasks give nothing: progress shown is progress on the habit.
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
  "Call it a pause" after a long break (§5) writes the same two records
  for the gap that has already passed.
- The days a stage waited while the user walked the smaller stage
  before it again (stepping back, §4) are not due for it either, and
  its task counts nothing on them.
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
- A completion on a day that is not due still counts (`count`,
  `time_spent`) and ends a series of misses, but does not
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

- **After the journey** (issue #66): the habit a finished journey
  leaves (§6) keeps the run of its last stage. The engine reports it on
  the finished run (`habit.run`, with `habit.lastDays`, the last 7 due
  or paused days) by the same rules, counted from the day the last
  stage began to count: finishing the journey neither ends the run nor
  starts a new one, and nothing else changes (no `offerFallback`, no
  events). Days the habit ran by itself before it was brought back are
  not due and count nothing, so the run stands. A graduated habit has
  no run and no days ("runs by itself"), and neither has a habit
  without a task that can be followed.

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

### Staying (issue #81)

Decided by the owner on 2026-11-12. A met stage is offered two equal
choices: continue, or stay a while ([design rule 1](psychology.md)).

- **The suggestion** (`offer.suggest`) comes from the latest weekly
  answer for this stage (the answer of the latest ISO week, rule 9):
  3 or lower, or no answer yet → `stay`; 5 or more → `continue`; 4 →
  `none`. It is only a suggestion; both choices are always there.
- **Staying costs nothing and changes nothing.** The stage keeps
  counting, its runs go on, the station stays met and the build stays
  ready. The `stay` record only quiets the offer for 7 days from its
  day (`offer.quietUntil`, the first day the offer is back): the hosts
  show Continue as a quiet action and do not announce the station as
  reached again. Staying again rewrites the record. The user can
  continue on any day.
- The 3/4/5 limits and the 7 days are design choices; no study defines
  them.

### Skipping (issue #81)

- A stage that is offered and has no task yet (state `unbound`) can be
  passed with "I already do this": a `skip` record with the day, and the
  next stage is accepted on that day.
- **A skipped stage earns nothing** (rule 8): no run, no completions,
  no welcome back, also when a task bound to it is ticked off. Its
  station has the state `skipped` ("already yours"): neither done nor a
  gap. It raises the build's version like a finished stage (§7); the
  view names those versions (`build.skipped`).
- **The last stage cannot be skipped:** a journey ends with a habit the
  user does. A skip record for the last stage is ignored, and so is one
  for a stage that has a checkpoint.
- **Undo:** the latest skip can be taken back while the stage after it
  is the current one and has no counting completion yet (`undoable` on
  the station). Taking it back withdraws the skip record and the
  acceptance of the stage after it; the version goes back, because
  nothing was earned.
- The [journey checker](story-format.md) warns when the second stage
  asks for more than 5 minutes: the first stage is then the only tiny
  one and skipping it would start the user at a large step.

### Stepping back (issue #82)

Decided by the owner on 2026-11-12: after a long break (§5) the user
can start smaller, with a real step back.

- **Which stage.** A `step-back` record for the current stage with the
  day makes the stage before it the current one again from that day. It
  is offered only when the stage before is finished (has a checkpoint):
  never on the first stage, and not after a skipped stage, which has
  nothing to go back to. A step-back record without a finished stage
  before is ignored.
- **The smaller stage counts from the day of the step back** (and from
  the day its task is bound, if that is later): its condition, runs and
  marker start again; completions from its first walk are not counted
  twice. It uses the task it had if that still repeats; otherwise it
  waits for a task (state `unbound`) and cannot be skipped. Weekly
  answers from before the step back suggest nothing for the offer; the
  first completion is a welcome back (§5). The station keeps its
  `doneDay` and names the day in `stepBackDay`.
- **Nothing is taken away.** Checkpoints stay, so the build's version
  stays (§7). The stage left behind keeps its acceptance, its task and
  what it counted, is `ahead` with `leftDay`, and its task counts
  nothing while it waits. Each stage keeps its own pairing (`pair`):
  taking the stage left up again copies none.
- **Taking it up again.** When the smaller stage is met it offers
  continue or stay as always. Continue writes no new checkpoint: it
  closes the step-back record with `until`, and the stage left behind
  is the current one again. The days from the step back to that day are
  not due for it (§2), so its completions, its `count` and `time_spent`
  totals and its marker progress are as they were.
- A stage can be left more than once (one record per step back), and
  after another long break on the smaller stage the user can step back
  again; the stages are then taken up again in order.

**Example F.** Stage 1 finished on 6 Oct, stage 2 (`count` 3) done on 7
and 8 Oct, then nothing. On 22 Oct the card is due; the user starts
smaller. Stage 1 is current again from 22 Oct with progress 0, the
version stays 2, the marker starts at 0. Stage 1 is done on 22 to 26
Oct: met; the user continues on 26 Oct. Stage 2 is current again with 2
of 3; 9 to 21 Oct are gaps (or paused, if the user also called them a
pause), 22 to 25 Oct are not due.

## 5. Welcome back and coming back

- The first counting completion after a missed due day is a **welcome
  back**: the engine counts it per stage (`welcomeBacks`) and the hosts
  greet it with one sentence (`event.welcome-back`). At most once per
  gap, also when the gap ended a run.
- So is a counting completion 14 or more days after the one before it
  (or after the day before the stage began to count), whatever lay
  between, gaps or a pause, and the first completion of a stage the
  user stepped back to (§4).
- It gives nothing and takes nothing; coming back is what is greeted.

### After a long break (issue #82)

Decided by the owner on 2026-11-12 ([design rule 14](psychology.md)).

- **The gap** of the current stage starts on the latest of: the day
  after its last counting completion, the day the journey was last
  resumed, the day the stage began to count (accepted, bound, stepped
  back to) and the day it was taken up again after a step back.
- **The card is due** (`comeBack` on the run, with the gap's first day
  `from`) when today is 13 or more days after that first day, so the
  last day that counted or was paused is at least 14 logical days ago,
  the stage has a task with a supported repeat, and the journey is the
  active one, not paused and not ended. With 13 days there is no card.
  While it is due the hosts show it instead of the hard-week hint.
- Three choices; none is suggested:
  1. **Carry on:** a `carry-on` record for the stage with the day.
     Nothing that is computed changes; the card is closed for this gap
     (the record's day is in or after the gap). After the next
     completion a new gap needs 14 days again.
  2. **Call it a pause:** a pause record on the gap's first day and a
     resume record today, so the days up to yesterday are paused, not
     gaps, and the run stands. It never reaches back further than the
     gap. The gap then starts today, so the card is gone.
  3. **Start smaller** (`comeBack.smaller` names the stage, when there
     is a finished stage before): the step back of §4. It can be
     combined with 2 in one change.
- 14 days is a design choice; no study defines it.

Since 3.3 there are no XP, no levels and no guardians (issue #110): they
had no effect any more, and the [evidence review](research.md) supports
real progress in words and a progress picture instead. Messages say the
real progress ("4 of 5 days"); nothing is announced before it is done.

## 6. Graduation

Issue #22; what a graduated habit is was decided by the owner on
2026-11-12 together with the anchors (#96, point 4): it is no longer
ticked off ([design rule 25](psychology.md)).

### The habit of a finished journey

- A journey that was finished (its last stage has a checkpoint) leaves
  **one habit**: its last stage's, with that stage's recurring task. A
  journey that is still open, or was ended early, has none.
- While it is **maintained** it is followed exactly as before (§1 to §3):
  due days and completions count from the day the last stage began to
  count, across the day the journey was finished, and its run goes on
  (§3). The weekly question goes on, once per ISO week, for this habit.
- Without a task that can be followed (the repeat was deleted or is of
  an unsupported kind) the habit is `unbound` or `unsupported-repeat`:
  nothing is asked, it cannot graduate, and the hosts offer to set up a
  task for it.

### When it can graduate

A maintained habit **can graduate** (`habit.canGraduate`) when all of
these hold:

1. **Three high answers in a row:** the weekly answers ("… is something
   I do automatically", 1–7) of 3 consecutive ISO weeks are each 6 or 7,
   and the last of the three weeks is this week or the one before. A
   skipped week breaks the row.
2. **Steady over four weeks:** completions on at least 80 % of the due
   days in the last 28 logical days (today included), or since the
   stage began to count if that is later. Only decided days are looked
   at: a due day with a completion, or one whose backfill window has
   passed (§2). Today and yesterday without a completion are still open
   and are left out; with no decided day the habit is not steady.
3. **No drop in the last two weeks:** the same 80 % over the last 14
   logical days. This is what remains of "reminders have been off or
   never set for at least 14 days, and completion did not fall in that
   time": the engine **cannot know** since when a task has no reminder.
   Its snapshot holds no reminder field, and Super Productivity's data
   has none with a date: a repeat config carries only its present
   `remindAt` and `startTime`
   ([facts](super-productivity-facts.md) §5), and what a plugin can
   read of them is still to be recorded (#60). So a reminder counts as
   **never set**, and no data is invented. When QuestArc suggests a
   reminder itself (#60), that issue adds what this rule needs.

It is offered, never pushed and never announced before it holds: no
progress towards it is shown, and the user can leave the offer alone for
as long as they like.

### Graduating

- The user's yes writes a `graduation` record with the day and what
  they do with the task (`graduate`): **end** its repeat themselves, or
  **keep** it repeating quietly. Neither is suggested. QuestArc never
  ends a repeat (the plugin API cannot, and the task is the user's):
  the hosts lead to the task.
- From that day the habit is **graduated**: it runs by itself. Nothing
  is followed: no due days, no runs, no weekly question, no messages,
  whatever the task does. With **keep**, ticking the task off counts for
  nothing. What the view shows of a graduated habit comes from its
  records alone, so it stays when the task is ended or deleted.

### Afterwards

- QuestArc asks **once** whether the habit still runs by itself 14 and
  42 days after graduation, and then every 182 days (at most twice a
  year). The question is due (`habit.graduated.checkDue`) from its date
  until it is answered; when a later date has come, only that one is
  due, so a question that passed unanswered is not asked again.
- The answer is yes or "not really" (`answerStill`, a
  `graduation-check` record under the date it was due). Yes changes
  nothing. "Not really" changes nothing either: the view says so
  (`suggestBack`) and the hosts offer to bring the habit back.
- **Bringing it back** (`bringBack`, at any time, not only after the
  question) closes the graduation record with `until`. From that day
  the habit is maintained again, as a growing step: followed, asked
  weekly, able to graduate anew. **Nothing is lost:** the days from
  graduation to that day are not due and count nothing (like the days
  of a step back, §4), so they never become gaps and the run stands.
  The day of graduation itself was still followed until the user's
  yes: a completion on it counts, and without one it is not due.
  If its repeat is gone, it waits for a task.
- Completion cannot suggest bringing a habit back any more ("below
  60 % in the 2 weeks before", the rule until 2026-11-14): a graduated
  habit is not ticked off, so there is nothing to count.

The numbers (3 answers, 6 of 7, 80 %, 28 and 14 days, 14, 42 and 182
days) are design choices; no study defines them, and the texts say so.

**Example G.** A journey was finished on 1 Oct; its last stage's task
is due daily and done every day. The answers of the weeks 44, 45 and 46
are 6, 7 and 6: on Wednesday of week 46 the habit can graduate. With a
5 in week 45, with week 45 skipped, or with the three answers in weeks
42 to 44 it cannot. With 6 misses between 15 and 28 Oct it cannot
either (22 of 28, 79 %), with 5 it can (23 of 28). With 3 misses in
the last 14 days it cannot (11 of 14), although 25 of 28 are done.

**Example H.** The habit graduates on 28 Oct. On 10 Nov nothing is
asked; from 11 Nov the question is due. Answered "not really", the
habit stays graduated and bringing it back is suggested. Brought back
on 11 Nov, the days from 28 Oct to 10 Nov are not due: a run of 30
before goes on with the next completion.

**Example I.** The last stage began on 1 Sep and the journey was
finished on 1 Oct; the task is done every day up to 11 Nov: the habit's
run is 72, not 42. With 3 and 4 Nov missed the run ended at 63 and the
current one is 7, the total 70. Graduated on 1 Oct and brought back on
28 Oct, with 28 Oct to 11 Nov done: the run is 45 (30 and 15), whether
or not the kept task was ticked off in between; 46 if it was also done
on 1 Oct, the day it graduated.

## 7. Builds

Issues #42, #99 and #110, decided by the owner on 2026-11-12 and
2026-11-13. Every journey builds one thing, whole after every stage; the hosts draw it,
the engine gives only names and numbers.

- **Ladder.** A journey names a ladder (story format, `build`): one
  thing drawn in several whole versions. The ladders are the picture
  files `content/art/<name>.ladder.json` (#95): their versions, whether
  their setting has `water`, their default `marker` and `hue`; the
  markers are in `markers.json` (`landOnly`), the hues in
  `palette.json`. The engine reads these names and numbers and nothing
  else of the pictures. The user may choose another ladder for a run
  (a `build` record, [data model](data-model.md) §2). A ladder the engine
  does not know, or a journey without `build`, gets the default
  ladder `home`, so a host always has pictures.
- **Version.** Version 1 stands when the journey starts. Every finished
  stage (a stage with a checkpoint,
  [deleted history](decisions/deleted-history.md)) raises the version by
  one, and so does a skipped stage (§4, #81). So the version is 1 + the
  journey's stages with a checkpoint or a skip; it never goes down by
  itself, because these records are kept whatever happens to the tasks
  (only the user taking a skip back lowers it). A step back (§4) does
  not lower it either: the larger version stays standing while the
  smaller stage is walked again, and its marker grows from 0 again. `skipped` lists the
  standing versions that came from a skipped stage, so a host can say
  "already yours" in the row of versions.
  `versions` is the number of versions the journey uses: its stages + 1.
  If that is more than the ladder has, the ladder's last version stands
  for the rest and gains one fixed addition per version beyond it (a
  flag, a bench; drawn by the host); the checker warns.
- **Marker progress** of the current stage: the highest condition
  progress (§4) the stage has reached on any day since it was accepted
  (and its task bound), from 0 to 1. The progress of a day `d` is the
  condition evaluated with the due days and credited completions up to
  `d`: for `days` the completions among the last `of` due days up to `d`
  ÷ `n`; `count` and `time_spent` only add up, so their highest value is
  today's. Because it is the highest of all days, it does not fall when
  the `days` window moves on. It is derived from the tasks every time,
  never stored ([decision](decisions/marker-progress.md)): undoing a
  completion takes back what it added, and so does deleting a done
  instance, deleting the repeat config or binding another task, as they
  do for progress. A host shows the first `ceil(p × E)` of a
  marker's `E` elements, so "5 of 7 days" and "20 times" fill the same
  marker.
- **Ready:** the current stage is met now (§4, state `met`). It follows
  the present: when a met stage falls below its condition, ready goes,
  the marker progress stays.
- **Marker:** what hangs on the marker (lanterns, bunting (pennants), flowers): the
  user's choice, else the journey's, else the ladder's default. A land-only
  marker (flowers) never hangs over water; a marker that does not fit the
  ladder's setting, or is not in the list, gives way to the next in that
  order. **Hue:** the user's choice, else the ladder's default.
- **Continue:** the next version stands and the marker starts again at
  0 with the next stage. A **paused** journey keeps its build; its paused
  days are not due, so its marker progress does not change. An **ended**
  journey (a `run-end` record) shows its version standing, without a
  marker (progress 0, not ready).
- **Events** (the active journey): `event.build-element`
  `{ from, to }` when the marker progress of the same stage rose (the
  host decides whether that makes a new element and stays quiet in
  between); `event.build-version` `{ version }` when the version rose,
  also when the last stage was finished and the journey ended, and when
  a stage was skipped. After a step back, or when the stage left is
  taken up again, the marker is another stage's: nothing is announced.

**Example E.** Example D's stage (`days` 5 of 7, due daily, accepted on
day 1). Days 1 to 5 done: progress and marker progress 1, ready. Days 6
to 8 missed, day 9 is today: the last 7 due days (3 to 9) hold 3
completions, so progress is 0.6 and the stage is no longer met; marker
progress stays 1, ready is false. Continue on day 5 instead: version 2,
marker progress 0.
