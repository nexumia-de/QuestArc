---
type: Concept
title: Design rules from habit psychology
description: The rules QuestArc follows so that it helps people build habits that last; each rule is backed by the evidence review, which holds the sources and the strength of the evidence.
tags: [psychology, habits, gamification, design]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Design rules from habit psychology

QuestArc exists to help people build habits that last, in Super
Productivity and in Pensum. What it shows serves that goal and must
never work against it. Every rule below comes from the
[evidence review](research.md), which cites the studies, rates how strong
the evidence is and lists what is still unknown. Where the evidence is
thin, the rule says so.

The short version of the evidence: habits form by **repeating one small
action in the same situation**. In studies this took a median of about
two months, but anything from a few days to most of a year; one missed
day did no measurable harm. Game elements help a little and fade;
punishment and comparison often backfire.

## The habit itself

1. **Start tiny, grow in stages.** A journey starts with a step too small
   to fail and offers the next, larger stage only when the current one has
   become easy. Completing a stage's condition is not ease: at a met
   station staying a while is as good a choice as continuing, costs
   nothing, and the user's own weekly answer (rule 9) suggests which one
   fits; the user decides. A stage the user already does can be passed
   ("already yours"); it earns nothing (rule 8), and a journey always
   ends with a habit the user does. Stages are short, and the distance
   to the next station is always visible. Growing the action is the
   least tested part of the design ([research](research.md#open-evidence-gaps)).
2. **Every stage is one plan: "After X, I will Y."** The plan names the
   anchor, the action and optionally the place. **The anchor is the
   user's** (decided 2026-11-12, #96): a moment that already exists in
   their day, in their own words: an existing routine or a fixed time;
   both work. A journey suggests a kind of moment ("a moment in your
   morning") with example words and never dictates them. The same
   anchor stays across the stages of a journey, and further journeys
   can start from it: habits form by repeating one action in a stable
   situation, the best supported finding of the
   [evidence review](research.md), and the anchor is that situation.
3. **One growing step.** Several plans at once weaken each other, so
   one journey runs at a time; it can be paused to start another, and
   the other anchors rest. The next step at an anchor is tied to that
   anchor again. The user may instead tie it to a step that has become
   a habit there ("After I drink a glass of water, I will …"): a chain
   is the user's choice and never the default, because a broken link
   takes what follows with it.
4. **No day count is promised.** Texts say "most simple habits take about
   two to five months, and it varies a lot", never "21 days" or "66 days".
5. **The user's own reason.** Each journey starts by asking why the user
   wants this habit, in their words. QuestArc shows that reason at
   stations and after a miss. Generic motivational quotes are not used.
6. **Optional: a quick plan check (WOOP).** At the start of a journey the
   user may name the wish, the best outcome, the main obstacle and the
   plan for it ("If …, then I will …"). Optional, short and collapsed,
   because its effect is small (g ≈ 0.28–0.34 with publication bias,
   [research](research.md)); skipping it takes no tap, any answer may
   stay empty, and nothing is rewarded for filling it in (rule 8). The
   plan for the obstacle comes back where it helps, in the user's
   words: in the hint after a second miss and in the station details.
   Nothing asks for it again; it can be filled in, changed or emptied
   later.
7. **Optional: "pair it with".** Each stage may name something the user
   enjoys only while doing the habit (a podcast only while walking). It
   is the user's own words, asked once when the stage's task is set up,
   never required and never rewarded (rule 8); it is shown as the end of
   the plan sentence and goes along to the next stage, where it can be
   changed or removed. The effect is small (about 10–12 % more workouts
   in the large replication, [research](research.md)).

## Progress and feedback

8. **Progress shown is real progress.** The journey and its build show
   completed stage tasks, nothing else, and messages say it in words
   ("4 of 5 days"). Nothing grows for opening the app.
9. **Weekly look back.** Once a week the journey shows the last days, the
   total and best runs, and asks one question,
   the validated single item of the automaticity index with the habit filled
   in: "Walking after lunch is something I do automatically" (1–7). The answers drive graduation and reminder fading.
   The look back shows the answers so far as a row of seven-step marks,
   week by week, and says "easier than four weeks ago" or "about the
   same" when that is so, and nothing when the answer is lower: no
   target line and no number to reach (rule 12). After a journey the
   question goes on for the habit it leaves, until that graduates
   (rule 25).
10. **Misses count against the user's own schedule.** A day is missed only
    if the recurring task was due that day. A task done late for yesterday
    (within a short backfill window) counts for yesterday.

## Missing days

11. **Never miss twice.** One missed day changes nothing. A second miss in
    a row ends the current run, but never the journey, and offers the
    previous, smaller stage as the fallback for hard days, without any
    penalty.
12. **A miss is a neutral gap.** No red marks, no counter falling to zero,
    no "you failed". The view shows total and best runs.
13. **Welcome back.** The first completion after a miss gets a fixed,
    friendly acknowledgement: one sentence, nothing more. This was the
    strongest single mechanic in the largest study. The first completion
    after a long break is greeted the same way, whatever the user chose
    for the break (rule 14).
14. **Pause, and coming back.** The user can pause a journey (illness,
    travel); paused days are not misses. Most people leave a habit app
    without pausing it, and the risk that a miss becomes a quit grows
    with the length of the gap ([research](research.md)). So when
    nothing has counted for 14 days, QuestArc does not show a row of
    gaps and a hint: it greets the user with one calm card, their own
    reason and three equal choices: carry on, call the gap a pause, or
    start smaller with the stage before. None is suggested; the user
    decides. Starting smaller takes nothing away (rule 16): what was
    built stays, and the larger stage waits and is offered again. The 14
    days are a design choice; no study defines them.
15. **Kind words only.** All texts are autonomy-supportive ("you could"),
    never controlling ("you must") or blaming.
16. **No permanent failure.** Nothing earned is ever taken away: runs,
    journeys and what a journey has built are never lost or reset, and
    there is no HP or any other value that falls because of misses.
    Going back to a smaller stage (rule 14) is the user's choice and
    lowers nothing.

## What grows

Rules 17 to 19 were rewritten on 2026-11-13 (#110): XP, levels,
guardians and the game mode are gone, because they had no effect any
more and the evidence for them is contested or indirect.

17. **One calm look.** There is no game mode, no points, no levels and
    no opponents. Every journey shows one thing it builds.
18. **Fixed rules only.** What grows follows fixed rules and is never
    announced before it is earned. No random rewards, loot boxes, login
    bonuses or paid extras.
19. **A picture of progress, not a score.** The build is whole after
    every stage and shows progress at a glance. It unlocks nothing and
    gives no power.
20. **Story is seasoning.** Story texts at stations add flavour; the habit
    works without them. Kept short and skippable.
21. **Cooperation, never rankings.** No leaderboards and no comparison
    with others. This is a values choice: competition showed the most
    lasting effect in one trial, but harms those who fall behind.

## Learning nuggets and reminders

22. **One learning nugget per station.** A short, concrete "try this"
    technique that fits the stage (choosing an anchor, making the step
    smaller, planning for a hard day, why one miss is fine). Shown in the
    app when the user arrives at a station, never as a push message, and
    never the same one twice.
23. **Reminders restate the plan and fade.** Reminders help repetition
    but can keep the phone as the cue instead of the user's routine
    ([research](research.md)). So QuestArc sends no notifications of its
    own (decided 2026-11-12, #60): the reminder is the host's own task
    reminder, which the user sets on their task, and the task's title
    restates the plan in short ("After lunch: walk 15 minutes").
    QuestArc suggests one at set-up, for the first weeks. As the weekly
    answers rise (two in a row of 5 or more) it says "you may not need
    the reminder any more" and leads to the task; it never sets or
    removes one. A habit graduates only without a reminder (rule 25).
    The two answers and the 5 are design choices; no study defines
    them.

## When a habit is done

24. **Habits stay.** The recurring task is the user's; QuestArc never
    deletes it and, in Super Productivity and Day Planner, never ends
    it. After a journey, its last habit stands at its anchor (rule 28),
    keeps running as a normal task and appears on the shelf as
    maintained, its run going on past the journey's end, with the
    weekly question going on, until it graduates (rule 25). A task ends
    only with the user's yes: by the user's hand where QuestArc cannot
    or may not end a repeat (it then leads to the task), and by a host
    that keeps the tasks itself (the standalone app) only for a repeat
    it created.
25. **Graduation by automaticity, not days.** A habit can graduate when
    the weekly answer stays high (6 or 7 for three weeks in a row) and
    completion is steady (four of five planned days over four weeks,
    with no drop in the last two, in which the task had no reminder
    as far as QuestArc saw; one it never saw counts as never set). Graduation is offered once it holds, never pushed
    and never announced before: no progress towards it is shown. A
    graduated habit is **no longer ticked off** (rule 28). The user
    decides what happens to the task: end its repeat
    themselves, or keep it repeating quietly, where it counts for
    nothing. QuestArc asks once, two and six weeks later and then at
    most twice a year, whether it still runs by itself; "not really"
    offers to bring it back as a growing step, and bringing it back
    takes nothing away (rule 16): the time it ran by itself never
    becomes gaps. The thresholds and the dates are design choices; no
    study defines them, and the texts say so.

26. **Tracking ends when the habit runs by itself.** Decided by the
    owner on 2026-11-12 (#96); the rule keeps its number at the end so
    that the other numbers stay. QuestArc is not a list of habits: its
    home is the user's anchors. Each shows the one step that is growing
    there and, in one line without boxes, what already runs by itself.
    Only a step that is still becoming a habit is ticked off: the
    growing step of the active journey, and the habit of a finished
    journey until it graduates. A graduated step is not followed,
    counted or reminded; it stands at its anchor from QuestArc's own
    records, also when its task is ended or deleted. So the list gets
    shorter, not longer. That ticking a habit which has become
    automatic is only work, and wears people out, is the owner's
    observation, not a study result; the page "How QuestArc motivates
    you" says why the list gets shorter (rule 26).

## Honesty and privacy

26. **Say how it works.** A page "How QuestArc motivates you" explains
    these rules in plain words.
27. **Success is the user's habit, not app use.** QuestArc collects no
    usage data. The measures that matter (steady completion over months,
    the weekly answer) are shown only to the user.
