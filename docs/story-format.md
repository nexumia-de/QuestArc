---
type: Reference
title: Story format 3
description: How a journey is written as JSON: stages with a plan, schedule, condition, optional guardian, story texts and a learning nugget; i18n keys; validation; versioning and what happens when a journey changes while someone walks it.
tags: [content, journeys, format, schema]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Story format 3

A journey is one JSON file. The schema is
`content/schema/journey.schema.json` (JSON Schema 2020-12); a complete
example is `content/examples/walking.json` with its texts in
`content/examples/en.json`. Built-in journeys live in `content/journeys/`
with their texts in `content/i18n/<language>.json`. CI checks every
journey against the schema and checks that every text key has an English
text (`packages/engine/test/content.test.ts`).

Format 3 replaces both 2.x formats (projects with `📜` and tags in task
titles, and the older `HeroStory` JSON). It takes HeroicRPG's idea that
each stage is a harder version of the same habit and GoVenture's habit
journey; how the engine uses it is in the [game rules](game-rules.md).

## Journey

| Field         | Required | Meaning                                                      |
| ------------- | -------- | ------------------------------------------------------------ |
| `format`      | yes      | Always `3`                                                   |
| `id`          | yes      | Lower case words with hyphens, unique, never reused          |
| `version`     | yes      | Content version, raised on every change                      |
| `title`       | yes      | Text key                                                     |
| `description` | yes      | Text key, one or two sentences                               |
| `why`         | no       | Text key: the prompt asking for the user's own reason        |
| `stages`      | yes      | 2 to 12 stages, in order                                     |
| `ending`      | no       | `{ "story": <text key> }`, shown when the last stage is done |

## Stage

| Field       | Required | Meaning                                                                                       |
| ----------- | -------- | --------------------------------------------------------------------------------------------- |
| `id`        | yes      | Unique within the journey, never reused                                                       |
| `plan`      | yes      | `anchor`, `action`, optional `place` (text keys): "After _anchor_, I will _action_ (_place_)" |
| `schedule`  | yes      | Suggested schedule: `daily`, `everyNDays` with `n` 2–7, or `weekdays` with `days`             |
| `condition` | yes      | `days` (`n` of the last `of` due days), `count` (`n`), or `time_spent` (`minutes`)            |
| `guardian`  | no       | `name` (text key) and `hp` (10–1000)                                                          |
| `story`     | no       | `arrival` (shown on reaching the station) and `accept` (shown when the next stage is offered) |
| `nugget`    | no       | Text key: one short, concrete "try this" technique for this stage                             |

The schedule is a suggestion: the user sets the real repeat in Super
Productivity, and only the supported kinds can be bound
([game rules](game-rules.md#due-days-issue-48)).

## Texts

- Every user-facing string is a **text key**: dot-separated, lower-case
  words with hyphens, starting with the journey id
  (`example-walking.walk-5.action`).
- Texts live in one flat file per language; English is required, other
  languages fall back to English key by key.
- Anchors and actions are written to fit the plan sentence: anchor
  "lunch", action "walk for 5 minutes".

## Writing a journey

The [design rules](psychology.md) apply. In short:

- The first stage is too small to fail; each next stage is a slightly
  harder version of the same habit, with the same anchor.
- Conditions are reachable: the default is `days` 5 of 7.
- Nuggets are concrete techniques in autonomy-supportive words ("you
  could"); no quotes, no day-count promises, no blame.
- Story texts are short and skippable; the habit works without them.
- Guardians are optional and never punish.

## Versions and changes

- `format` changes only when the structure changes. The engine reads
  format 3; a later format comes with a converter from format 3.
- When a journey's content changes (`version` raised) while someone walks
  it:
  - finished stages keep their checkpoints
    ([deleted history](decisions/deleted-history.md));
  - the current stage keeps its id, so its progress stays;
  - if the current stage's id no longer exists, the user continues at the
    first stage that is not finished;
  - stage ids are never reused for a different habit.
