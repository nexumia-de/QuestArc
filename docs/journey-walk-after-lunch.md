---
type: Concept
title: 'Journey: A walk after lunch'
description: The built-in journey for movement; every day after lunch, from stepping outside the door to a 20-minute walk in four stages, building a Crossing with its own version names; based on the evidence on walking after meals and on exercise habits.
tags: [content, journey, movement, walking]
resource: ../content/journeys/walk-after-lunch.json
generated: { by: claude-code/2.1.318, at: 2026-11-13 }
sources:
  - '[^37]: https://github.com/nexumia-de/quest-arc/issues/37'
  - '[^engeroff]: https://doi.org/10.1007/s40279-022-01808-7'
  - '[^buffey]: https://doi.org/10.1007/s40279-022-01649-4'
  - '[^reynolds]: https://doi.org/10.1007/s00125-016-4085-2'
  - '[^thogersen]: https://doi.org/10.1111/sms.12398'
  - '[^kaushal]: https://doi.org/10.1007/s10865-015-9640-7'
  - '[^judah]: https://doi.org/10.1111/j.2044-8287.2012.02086.x'
  - '[^who]: https://doi.org/10.1136/bjsports-2020-102955'
---

# Journey: A walk after lunch

Issue #37[^37]. The owner chose movement as a topic: a short walk after
a fixed anchor, growing in minutes. File:
[`content/journeys/walk-after-lunch.json`](../content/journeys/walk-after-lunch.json).
Evidence:
[movement](research.md#movement-evidence-for-the-journey-a-walk-after-lunch).

## Stages

All stages daily; anchor "lunch".

| Stage     | Plan ("After lunch, I will …")                            | Condition    |
| --------- | --------------------------------------------------------- | ------------ |
| `door`    | step outside the door and take a few breaths of fresh air | 5 of 7 days  |
| `walk-5`  | walk for 5 minutes, there and back                        | 5 of 7 days  |
| `walk-10` | walk for 10 minutes at an easy pace                       | 5 of 7 days  |
| `walk-20` | walk for 20 minutes, a round I like                       | 8 of 10 days |

The journey builds a **Crossing** ([game rules](game-rules.md) §7) with
lanterns on the marker (the ladder's default): a walk leads out and
over, and a crossing grows the way the walk does, from a few stones to
a bridge for any weather. Four stages use all five versions, so the
checker has no warning. The versions have the journey's own names
(`build.names`):

| Version | Name                              | The ladder's title |
| ------- | --------------------------------- | ------------------ |
| 1       | A row of stepping stones          | Stepping stones    |
| 2       | A log to balance across           | A log              |
| 3       | A plank bridge for short rounds   | A plank bridge     |
| 4       | A stone bridge for an easy stroll | A stone bridge     |
| 5       | A covered bridge for any weather  | A covered bridge   |

The names start with "A" so the line of state reads "A log to balance
across stands". They describe the Crossing's pictures. The view shows a
journey's names with whatever ladder the user picks
(`versionName` in `packages/plugin/src/ui/ladder.ts`), so a user who
changes to the Home sees these names under a hut; that is a question for
the view, not for this file.

## How it follows the evidence and the design rules

- **Start tiny** (rule 1): stepping outside the door takes a minute in
  any weather and in any clothes. Every later stage starts with it, so
  it is the fallback on hard days (rule 11), and the last nugget says so
  as an if-then plan.
- **One anchor, placed after a routine** (rule 2): "after lunch" is a
  routine most days have. In an exploratory study, people who placed a
  new action after an existing routine formed stronger habits than those
  who placed it before[^judah]. In new gym members, consistency and low
  complexity predicted exercise habit[^kaushal]; hence one simple
  action, every day, with room for misses.
- **Why after a meal:** in a meta-analysis of small crossover trials,
  exercise (mostly walking at moderate intensity for 20 to 60 minutes)
  after a meal lowered the rise of blood glucose more than exercise
  before it, and more the sooner it began[^engeroff]. Light walking breaks lowered glucose after meals
  more than standing or sitting on[^buffey]. Ten minutes after each main
  meal did more for glucose after meals than 30 minutes at one time, in
  adults with type 2 diabetes[^reynolds]. These are acute measurements,
  not health outcomes; one nugget (`walk-10`) says only that, as "in
  small studies", and of "a walk", not "an easy walk", because the
  trials did not test an easy pace or a walk under 20 minutes. The
  meta-analyses and the guideline were read in full on 2026-11-14; the
  other studies in their abstracts
  ([what was checked where](research.md#movement-evidence-for-the-journey-a-walk-after-lunch)).
- **Minutes are a ramp, not a dose:** 5, 10 and 20 minutes are small
  steps the user may change. The guideline's message is that some
  activity is better than none[^who]; the journey names no step count,
  no weekly target and no result.
- **Mood at work:** lunchtime walks improved some momentary feelings at
  work in one small trial with group-led 30-minute walks[^thogersen].
  The texts promise no such effect.
- **Honest texts** (rules 4, 15, 26): no number of days, no weight,
  fitness, digestion or energy claims, no "10,000 steps"; "you could"
  throughout; no opponents, points or levels. Story texts speak of a
  piece that stands and of what grows, without naming what is built and
  without a path (rule 20).
- **Nuggets** (rule 22): shoes or jacket near where you eat; why a day
  without a walk changes nothing; why soon after eating is a good
  moment; an if-then plan for rain or a full day.
- The action is also the station's name, cut after two lines, so the
  minutes come early ("walk for **10** minutes …").

## Checked in the preview

At 360 × 720 on 2026-11-13: the journey's card in the list, its page,
the start page ("You build: Crossing · lanterns · water blue"), the
journey with "A row of stepping stones stands" on one line, and the
list of stations; every action fits two lines, no horizontal overflow.

## Later

- A weekday variant (Monday to Friday, 4 of 5) for people who only have
  a fixed lunch at work; the user can already set the repeat that way.
- Pairing the walk with something enjoyed only then (rule 7) is offered
  by the app per stage, so no nugget repeats it.
