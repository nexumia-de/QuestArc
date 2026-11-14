---
type: Reference
title: Story format 3
description: How a journey is written as one self-contained JSON file: stages with a plan, schedule, condition, story texts and a learning nugget; its own texts per language and author; the journey checker; versioning and what happens when a journey changes while someone walks it.
tags: [content, journeys, format, schema]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Story format 3

A journey is **one self-contained JSON file** with its own texts
([decision](decisions/journeys-by-pull-request.md)). The schema is
`content/schema/journey.schema.json` (JSON Schema 2020-12); a complete
example is `content/examples/example-walking.json`. Built-in journeys
are the files in `content/journeys/`, named `<id>.json`; the plugin
finds every file there (`packages/ui/journeys.mjs`), so a new
journey is one new file. CI checks every file against the schema and
with the journey checker (below). How to write and publish one:
[Writing a journey](authoring-journeys.md).

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
| `author`      | no       | Name or pseudonym shown as "Written by …" (at most 60 chars) |
| `title`       | yes      | Text key                                                     |
| `description` | yes      | Text key, one or two sentences                               |
| `why`         | no       | Text key: the prompt asking for the user's own reason        |
| `anchor`      | no       | The kind of moment the journey starts from (below)           |
| `stages`      | yes      | 2 to 12 stages, in order                                     |
| `ending`      | no       | `{ "story": <text key> }`, shown when the last stage is done |
| `build`       | no       | What the journey builds (below)                              |
| `texts`       | yes      | Texts by language: `{ "en": { <text key>: <text> }, … }`     |

## Stage

| Field       | Required | Meaning                                                                                       |
| ----------- | -------- | --------------------------------------------------------------------------------------------- |
| `id`        | yes      | Unique within the journey, never reused                                                       |
| `plan`      | yes      | `anchor`, `action`, optional `place` (text keys): "After _anchor_, I will _action_ (_place_)" |
| `schedule`  | yes      | Suggested schedule: `daily`, `everyNDays` with `n` 2–7, or `weekdays` with `days`             |
| `condition` | yes      | `days` (`n` of the last `of` due days), `count` (`n`), or `time_spent` (`minutes`)            |
| `story`     | no       | `arrival` (shown on reaching the station) and `accept` (shown when the next stage is offered) |
| `nugget`    | no       | Text key: one short, concrete "try this" technique for this stage                             |

The stages' `anchor` is the journey's suggestion. Once the user has
named their anchor (below), its words stand in every plan sentence of
the run instead; the suggestion shows in the list of journeys, in the
preview and for a journey started before anchors.

The schedule is a suggestion: the user sets the real repeat in Super
Productivity, and only the supported kinds can be bound
([game rules](game-rules.md#due-days-issue-48)).

## Anchor

The kind of moment the journey starts from ([design rule 2](psychology.md),
[game rules](game-rules.md) §8, issue #96). A hint for the start screen:
the user names the anchor in their own words, or picks one they already
have, and the journey never dictates the words.

| Field     | Required | Meaning                                                                                                      |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `moment`  | yes      | Text key: the kind of moment, to end "This journey starts from …": "a moment in your morning" (60 chars)     |
| `example` | yes      | Text key: example words that complete "After …": "getting up"; usually the key the stages use as plan anchor |
| `time`    | no       | `HH:MM` (24 hours): suggests a fixed time instead of a routine                                               |

```json
"anchor": { "moment": "gentle-morning.moment", "example": "gentle-morning.anchor" }
```

The field is optional; an engine that does not know it ignores it, so
the format stays 3.

## Build

What the journey builds ([game rules](game-rules.md) §7,
issue #42). The names come from the built-in list
the ladders in `content/art/` (`<name>.ladder.json`, `markers.json`); pictures are found by these names in the hosts.

| Field    | Required | Meaning                                                                                        |
| -------- | -------- | ---------------------------------------------------------------------------------------------- |
| `ladder` | yes      | A ladder from the list (`home`, `crossing`, …)                                                 |
| `marker` | no       | What hangs on the marker: `lanterns`, `bunting` or `flowers`; the ladder's default if left out |
| `names`  | no       | Text keys naming the versions in the journey's own words, version 1 first (at most 40 chars)   |

```json
"build": { "ladder": "crossing", "names": ["first-things-first.build.v1"] }
```

The user may choose another ladder, marker and hue when starting; the
journey only suggests. The `names` were written for the journey's own
ladder: if the user chose another one, the hosts show that ladder's
generic version titles instead (#115; the engine's view carries only the
chosen ladder, so a host compares it with `build.ladder`).

## Texts

- Every user-facing string is a **text key**: dot-separated, lower-case
  words with hyphens, starting with the journey id
  (`example-walking.walk-5.action`). The ids `ui` and `event` are
  reserved for the app's own texts in `content/i18n/<language>.json`.
- The journey's `texts` holds one block per language (`en`, `de`,
  `pt-BR`, …). English is required and has a text for every key; other
  languages fall back to English key by key and may only use keys of
  the journey. Built-in journeys have every text in every language of
  `content/i18n/` (now English and German, #39); a private journey may
  have English only.
- The hosts show one language: the one of `content/i18n/` that matches
  the host's (Super Productivity's language, Pensum's locale), English
  for any other and behind every missing key (`textsIn`,
  `pickLanguage` in `packages/engine/src/texts.ts`;
  [behaviour](behaviour.md), language).
- **German plan form.** German names a step "15 Minuten spazieren
  gehen" but plans "Nach dem Mittagessen gehe ich 15 Minuten
  spazieren", so every action has a second German text under
  `<action key>.plan` (`walk-after-lunch.walk-5.action.plan`: "gehe
  ich 5 Minuten spazieren, hin und zurück"); the checker requires it
  for German. German anchors and moments are written in the dative
  after "nach"/"von": anchor "dem Mittagessen", moment "einem Moment
  um die Mittagszeit".
- Anchors and actions are written to fit the plan sentence: anchor
  "lunch", action "walk for 5 minutes". The user's own anchor takes
  the anchor's place: their words ("After my noon break, …"), a fixed
  time ("At 12:30, …") or, in a chain, the action of the step the run
  follows ("After I drink a glass of water, …"), so an action reads
  well after "I" and after "I will". The user may end it with
  something they pair the stage with (", with my podcast",
  [behaviour](behaviour.md), flow B), so an action does not name a
  treat of its own.
- The longest texts per field (360 px): title 40, description 160, why
  120, anchor 40, moment 60, action 120, place 40, arrival 200,
  accept 200, nugget 240, ending 240, build name 40 characters. A station's action is
  also its name on the path, cut after two lines, so the part that
  differs from the previous stage comes early.

## The journey checker

`journeyProblems()` in `packages/engine/src/content-check.ts` checks
what can be checked without a person; `npm run journeys` runs it on
every file, and `npm run check` (CI) includes it. A future import of
private journeys (#40) runs the same function.

| Level   | Check                                                                                                                | Rule       |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ---------- |
| error   | structure (`journeyErrors`); English texts present; keys start with the id; other languages' keys exist              | —          |
| error   | a built-in journey without a text in a language of `content/i18n/`; a German action without its `.plan` form         | —          |
| error   | text lengths above                                                                                                   | —          |
| error   | a number of days ("21 days")                                                                                         | 4          |
| error   | quotes with an author                                                                                                | 5          |
| error   | controlling words (must, have to, you should, no excuses; German: müssen, du solltest, nicht vergessen)              | 15         |
| error   | blame (fail…, lazy, guilt, break the chain; German: verpasst, versäumt, Fehler, Rückfall, zurückstufen) and streaks  | 11, 12, 15 |
| error   | the same nugget twice                                                                                                | 22         |
| warning | a `days` condition without room for one miss, or looking back more than 14 days                                      | 1, 11      |
| warning | a stage without a nugget, a journey without `why`; English texts no key uses                                         | 5, 22      |
| warning | the second stage asks for more than 5 minutes (its `time_spent` condition or "n minutes" in its English action)      | 1          |
| warning | stages that name different anchors (English text); a journey without the `anchor` hint                               | 2          |
| error   | `build`: a ladder or marker not in `content/art/`; a land-only marker (`flowers`) on water; more names than versions | 42         |
| warning | no `build`; more stages than the ladder has versions minus one (its last version gains fixed additions)              | 42         |

The test also checks that each file is named after its id and that ids
are unique.

## Writing a journey

The [design rules](psychology.md) apply; the full guide for people and
their agents is [Writing a journey](authoring-journeys.md). In short:

- The first stage is too small to fail; each next stage is a slightly
  harder version of the same habit, with the same anchor: one moment
  for the whole journey, named in the `anchor` hint. A user who
  already does the first stage may skip it (#81), so the second one is
  still a small step.
- Conditions are reachable: the default is `days` 5 of 7.
- Nuggets are concrete techniques in autonomy-supportive words ("you
  could"); no quotes, no day-count promises, no blame.
- Story texts are short and skippable; the habit works without them.
- Story texts speak of building and growing, without naming what is
  built (the user may choose another ladder), without a path and
  without opponents.

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
- **No guardians since 3.3** (#110). The checker and the schema refuse a
  `guardian` in a stage; the engine ignores the field in a journey
  written before (an imported `journey:` record), so that journey still
  works.
