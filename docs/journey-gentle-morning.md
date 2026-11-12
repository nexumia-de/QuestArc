---
type: Concept
title: "Journey: A gentle morning"
description: The first built-in journey, chosen by the owner (a morning routine): four stages from one glass of water to a short routine with stretching and one thing written down for the day, and how it follows the design rules.
tags: [content, journey, morning-routine]
resource: ../content/journeys/gentle-morning.json
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Journey: A gentle morning

Issue #34. The owner chose a morning routine as the topic of the first
built-in journey on 2026-11-05. File:
[`content/journeys/gentle-morning.json`](../content/journeys/gentle-morning.json),
texts in `content/i18n/en.json` (keys `gentle-morning.*`).

## Stages

| Stage       | Plan ("After getting up, I will …")                                                 | Condition    | Guardian                  |
| ----------- | ----------------------------------------------------------------------------------- | ------------ | ------------------------- |
| `water`     | drink a glass of water (in the kitchen)                                             | 5 of 7 days  | —                         |
| `stretch-1` | drink a glass of water and stretch for one minute                                   | 5 of 7 days  | —                         |
| `stretch-5` | drink a glass of water and stretch for five minutes                                 | 5 of 7 days  | The Heavy Blanket, 100 HP |
| `plan-day`  | drink a glass of water, stretch for five minutes and write down one thing for today | 8 of 10 days | The Morning Rush, 150 HP  |

All stages are daily. In game mode the journey builds a **Home**
([game rules](game-rules.md) §9): four stages use all five versions,
from a fireplace to a house, with lanterns on the marker; a morning
routine is something one comes home to every day.

A guardian with 100 HP falls after 10 completions
(10 XP each, [game rules](game-rules.md) §5–6), so it is usually still
there when the stage is met: an extra, never a condition.

## How it follows the design rules

- **Start tiny** (rule 1): a glass of water is small enough for the worst
  morning. Each next stage is the same routine with one small addition.
- **One plan, same anchor** (rule 2): every stage starts "After getting
  up", a routine everyone has; the place is named once.
- **The earlier step on hard days** (rule 11): each stage contains the
  previous one, so "just the water" is always the fallback.
- **Learning nuggets** (rule 22), one per station, never repeated: a cue
  in the environment (glass by the tap), why one miss is fine, an if-then
  plan for a hard morning, pairing the stretch with a song.
- **No promised number of days** (rule 4), no quotes (rule 5), kind words
  only (rule 15): texts say "you could", the guardians are things
  everyone knows (a heavy blanket, the morning rush), never the user.
- **Story is seasoning** (rule 20): the path goes from the kitchen at dawn
  to the sun being up; one sentence per station.
