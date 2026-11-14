---
type: Concept
title: 'Journey: A few pages before sleep'
description: The built-in journey for reading; every day after getting into bed, from one page of a book to 20 minutes of reading in four stages, building a Home with its own version names; based on the evidence on reading a book in bed and on habits placed after a routine; the texts make no claim about screens and sleep.
tags: [content, journey, reading, evening]
resource: ../content/journeys/pages-before-sleep.json
generated: { by: claude-code/2.1.318, at: 2026-11-13 }
sources:
  - '[^37]: https://github.com/nexumia-de/quest-arc/issues/37'
  - '[^finucane]: https://doi.org/10.1186/s13063-021-05831-3'
  - '[^chang]: https://doi.org/10.1073/pnas.1418490112'
  - '[^gronli]: https://doi.org/10.1016/j.sleep.2016.02.006'
  - '[^hartstein]: https://doi.org/10.1016/j.sleh.2024.05.001'
  - '[^rizzolo]: https://doi.org/10.19030/tlc.v6i8.1117'
  - '[^bavishi]: https://doi.org/10.1016/j.socscimed.2016.07.014'
  - '[^judah]: https://doi.org/10.1111/j.2044-8287.2012.02086.x'
---

# Journey: A few pages before sleep

Issue #37[^37]. The owner chose reading as a topic: a few pages at a
fixed moment, growing in pages or minutes. File:
[`content/journeys/pages-before-sleep.json`](../content/journeys/pages-before-sleep.json).
Evidence:
[reading](research.md#reading-evidence-for-the-journey-a-few-pages-before-sleep).

## Stages

All stages daily; anchor "getting into bed".

| Stage      | Plan ("After getting into bed, I will …") | Condition    |
| ---------- | ----------------------------------------- | ------------ |
| `one-page` | read one page of my book                  | 5 of 7 days  |
| `read-5`   | read for 5 minutes in my book             | 5 of 7 days  |
| `read-10`  | read for 10 minutes in my book            | 5 of 7 days  |
| `read-20`  | read for 20 minutes in my book            | 8 of 10 days |

The first stage counts a page, the later ones minutes: one page is the
smallest whole piece of reading, and minutes grow evenly whatever the
book. The fixed moment is getting into bed because everyone has it
every day, the book can wait there, and it is the one moment for which
a trial of reading exists[^finucane].

The journey builds a **Home** ([game rules](game-rules.md) §7) with
bunting on the marker (the ladder's default): reading in bed is
something one comes home to. Four stages use all five versions, so the
checker has no warning. The versions have the journey's own names
(`build.names`):

| Version | Name                            | The ladder's title |
| ------- | ------------------------------- | ------------------ |
| 1       | A fire to read by               | A fireplace        |
| 2       | A tent for one more page        | A tent             |
| 3       | A hut for quiet evenings        | A hut              |
| 4       | A cottage with a reading corner | A cottage          |
| 5       | A house full of stories         | A house            |

The names start with "A" so the line of state reads "A fire to read by
stands". They describe the Home's pictures; the view shows a journey's
names with whatever ladder the user picks (see
[A walk after lunch](journey-walk-after-lunch.md)).

## How it follows the evidence and the design rules

- **Start tiny** (rule 1): one page takes a minute on the latest
  night. Every later stage contains it, so it is the fallback on hard
  days (rule 11); the last nugget says so as an if-then plan.
- **One anchor, placed after a routine** (rule 2): the plan follows
  getting into bed. In an exploratory study, people who placed a new
  action after an existing routine formed stronger habits than those who
  placed it before[^judah].
- **Reading a book in bed:** in an online randomised trial over seven
  nights, more people who read a book in bed said their sleep had
  improved than people who did not read in bed[^finucane]. The outcome
  is self-rated and nobody could be blinded, so the texts make no
  promise about sleep.
- **A printed book, without a sleep claim:** in a lab study, twelve
  young adults who read on a light-emitting tablet at full brightness
  for about four hours before bedtime took about ten minutes longer to
  fall asleep than with a printed book[^chang]. With 30 minutes of
  reading in bed at home, the time to fall asleep did not differ between
  a tablet and a book[^gronli], and an expert panel reached no consensus
  that screens before sleep impair adults' sleep[^hartstein]. The texts
  therefore say nothing about screens and sleep, as in
  [Evening wind-down](journey-evening-wind-down.md). The nugget of
  `read-10` suggests a printed book because it has nothing else to open,
  and leaving the phone out of reach. Until 2026-11-14 it quoted the lab
  study without its limits.
- **Calm, not gains:** one 30-minute reading session lowered blood
  pressure and heart rate in 22 students as much as yoga or humour, with
  no change in the stress questionnaire[^rizzolo]; book readers lived
  longer in a cohort of older adults, an association[^bavishi]. Neither
  is used in the texts: no "reduces stress", no longer life, no claims
  about memory, vocabulary or empathy.
- **Minutes are a ramp, not a target:** 5, 10 and 20 minutes are small
  steps the user may change; no pages per day and no books per year.
  The accept text of `read-5` invites swapping the book for one the
  user looks forward to more, because a habit that is liked is repeated
  (affective judgements predicted habit in the exercise study cited for
  [A walk after lunch](journey-walk-after-lunch.md)).
- **Honest texts** (rules 4, 15, 26): no number of days, "you could"
  throughout, no opponents, points or levels. Story texts speak of a
  piece that stands and of what grows, without naming what is built and
  without a path (rule 20).
- **Nuggets** (rule 22): the book on the pillow in the morning; why an
  evening without reading changes nothing; why a printed book suits the
  moment; an if-then plan for a late night.
- The action is also the station's name, cut after two lines, so the
  amount comes early ("read for **10** minutes …").

## Checked in the preview

At 360 × 720 on 2026-11-13: the journey's card in the list, its page,
the start page ("You build: Home · pennants · meadow green"), the
journey with "A fire to read by stands" on one line, and the list of
stations; every action fits two lines, no horizontal overflow.

## Later

- Other fixed moments (the first coffee, the commute) need another
  anchor and so another journey or a changed plan; the evidence above is
  about reading in bed only.
