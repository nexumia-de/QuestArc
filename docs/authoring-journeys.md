---
type: Guide
title: Writing a journey
description: Self-contained guide for people and their AI agents who want to write a QuestArc journey and publish it by pull request; the design rules in short, the file, a template, what CI checks, the licence and how review works.
tags: [content, journeys, contributing, guide, agents]
resource: ../content/schema/journey.schema.json
generated: { by: claude-code/2.1.318, at: 2026-11-06 }
---

# Writing a journey

Anyone can write a journey for QuestArc, alone or with an AI agent, and
publish it for everyone by pull request. The owner reviews it and merges
what is good; it then ships with the next release in the Super
Productivity plugin and in Pensum. This page is all you or your agent
need: hand it over with a sentence like _"Read
`https://github.com/nexumia-de/quest-arc/blob/main/docs/authoring-journeys.md`
and write a QuestArc journey for <topic>."_

A journey cannot be private yet: it is either published here or not
used. Importing your own journey without publishing it is planned for a
later milestone (#40); it will accept the same file.

## What a journey is

A journey turns one habit into 2 to 12 **stages**. Each stage
is one plan, _"After <anchor>, I will <action> (<place>)."_, done as a
recurring task in Super Productivity or Pensum. A stage is met when its
**condition** holds (default: 5 of the last 7 due days); then the user
may accept the next, slightly bigger stage. Arriving at a station shows
one sentence of story and one **nugget**: a concrete technique to try.

Look at [`content/journeys/gentle-morning.json`](../content/journeys/gentle-morning.json)
(from a glass of water to a short morning routine) before you start.

## The rules your journey must follow

These come from QuestArc's [design rules](psychology.md), which rest on
an [evidence review](research.md). They are binding; CI checks what it
can, the reviewer checks the rest.

1. **One habit, starting tiny.** The first stage is so small it works on
   the worst day (one glass of water, writing down one task). Each next
   stage is the same habit, a little bigger; ideally it contains the
   previous stage, so the smaller step is the fallback on hard days. A
   user who already does the first stage can skip it, so keep the
   second one small too. _CI warns when it asks for more than 5 minutes._
2. **One anchor for all stages.** Every stage starts with the same
   "After …". The anchor is the user's: they name the moment in their
   own words when they start, or pick one they already have, and their
   words stand in the plan. Your journey says what kind of moment it
   starts from and gives example words (`anchor`, below). _CI warns
   when stages name different anchors or the hint is missing._
3. **Reachable conditions.** Use `days` with room for one miss (5 of 7,
   4 of 5, 8 of 10). Never require every day: one missed day changes
   nothing in QuestArc. _CI warns otherwise._
4. **No promised number of days.** Never "21 days" or "66 days"; habits
   take very different times. _CI rejects numbers of days in texts._
5. **Kind words only.** Say "you could", never "you must", "you should"
   or "have to". A miss is a neutral gap: no "failed", "lazy", "guilt",
   no streaks. _CI rejects these words._
6. **No quotes.** No motivational quotes or famous sayings. Ask for the
   user's own reason instead (`why`). _CI rejects quotes with an author._
7. **One nugget per station, never repeated.** A concrete technique that
   fits the stage: a cue in the environment, making the step smaller, an
   if-then plan for a hard day, why one miss is fine, pairing the habit
   with something enjoyable. _CI rejects duplicates and warns if one is
   missing._
8. **Story is seasoning.** One or two short sentences per station; the
   habit works without them. Every journey builds something
   and the user may choose what, so the texts speak of building and
   growing ("the first piece stands", "what you started keeps growing")
   without naming a house or a bridge, without a path to walk and
   without opponents. _CI rejects a `guardian`; journeys have none since
   3.3._
9. **Honest claims.** If the journey is about work, health or learning,
   base it on research and name the sources in your pull request. No
   medical or therapeutic claims; no promises of results.
10. **Weekly or more often.** Supported schedules are daily, every 2–7
    days, or chosen weekdays.

## The file

One journey is **one file**: `content/journeys/<id>.json`. Nothing else
needs to change; the apps find every file in that folder. The full
format is in [story format 3](story-format.md) and the JSON Schema
[`content/schema/journey.schema.json`](../content/schema/journey.schema.json).

- `id`: lower-case words with hyphens, unique, also the file name
  (`first-things-first` → `first-things-first.json`). Not `ui` or
  `event`.
- `version`: start at 1.
- `author`: your name or pseudonym, shown in the app as "Written by …".
  It stays public in the repository and its history for good, also if
  the journey is removed later. Leave it out to stay anonymous.
- Every text is a **key** starting with the id (`first-things-first.title`),
  and the file's `texts.en` holds the English text for every key.
  Built-in journeys also have every key in German (`texts.de`), so CI
  fails without it; if you do not write German, say so in the pull
  request and the owner adds it. German needs one more text per action,
  `<action key>.plan`, the action as the plan sentence says it ("gehe
  ich 5 Minuten spazieren" next to "5 Minuten spazieren gehen"), and
  writes anchors and moments in the dative ("dem Mittagessen", "einem
  Moment um die Mittagszeit").
- Anchors and actions are written to fit the plan sentence: anchor
  "sitting down at my desk", action "write down the one task that
  matters most today".
- `anchor`: `moment` says what kind of moment the journey starts from,
  to end the sentence "This journey starts from …" ("the moment your
  work begins"); `example` is the words you suggest after "After …",
  usually the same key your stages use. With `time` ("21:30") the
  start screen suggests a fixed time instead.

### Template

```json
{
  "$schema": "../schema/journey.schema.json",
  "format": 3,
  "id": "my-journey",
  "version": 1,
  "author": "Your name",
  "title": "my-journey.title",
  "description": "my-journey.description",
  "why": "my-journey.why",
  "anchor": { "moment": "my-journey.moment", "example": "my-journey.anchor" },
  "build": { "ladder": "home" },
  "stages": [
    {
      "id": "first",
      "plan": { "anchor": "my-journey.anchor", "action": "my-journey.first.action" },
      "schedule": { "type": "daily" },
      "condition": { "type": "days", "n": 5, "of": 7 },
      "story": { "arrival": "my-journey.first.arrival", "accept": "my-journey.first.accept" },
      "nugget": "my-journey.first.nugget"
    },
    {
      "id": "second",
      "plan": { "anchor": "my-journey.anchor", "action": "my-journey.second.action" },
      "schedule": { "type": "weekdays", "days": ["mon", "tue", "wed", "thu", "fri"] },
      "condition": { "type": "days", "n": 4, "of": 5 },
      "story": { "arrival": "my-journey.second.arrival", "accept": "my-journey.second.accept" },
      "nugget": "my-journey.second.nugget"
    }
  ],
  "ending": { "story": "my-journey.ending" },
  "texts": {
    "en": {
      "my-journey.title": "Short title",
      "my-journey.description": "One or two sentences: from the first tiny step to the habit.",
      "my-journey.why": "Why do you want this? In your own words.",
      "my-journey.anchor": "lunch",
      "my-journey.moment": "a moment around midday",
      "my-journey.first.action": "do the tiny first step",
      "my-journey.first.arrival": "One sentence of story at the first station.",
      "my-journey.first.accept": "This became easy. You could try a little more.",
      "my-journey.first.nugget": "You could put a cue where you will see it.",
      "my-journey.second.action": "do the tiny first step and a little more",
      "my-journey.second.arrival": "One sentence of story at the second station.",
      "my-journey.second.accept": "One more sentence.",
      "my-journey.second.nugget": "Missing one day is fine. What matters is coming back the next time.",
      "my-journey.ending": "One sentence when the journey is done."
    }
  }
}
```

### Text lengths

Texts must fit a 360 px phone. CI rejects longer ones (characters):
title 40, description 160, why 120, anchor 40, moment 60, action 120, place 40,
arrival 200, accept 200, nugget 240, ending 240.

A stage's action is also the station's name in the list of stations,
cut after two lines on a phone. Put what is new in a stage early ("give it **45**
quiet minutes", not a long common start), so stations do not look the
same.

### What it builds

A journey builds one thing, a larger whole version after
every stage ([game rules](game-rules.md) §7). Name a ladder from
`content/art/` (`home`, `crossing`: the `<name>.ladder.json` files) in `build`. You may name
what hangs on its marker (`lanterns`, `bunting`, or `flowers` where the
ladder's setting has no water) and give the versions names in your own
words (`names`, text keys, at most 40 characters). A journey with more
stages than the ladder has versions minus one gets a warning: its last
version then gains small fixed additions. The user may choose another
ladder when starting.

### Conditions

- `days` `n` of the last `of` due days (default 5 of 7; for weekdays 4
  of 5); `count` `n` completions; `time_spent` `minutes` tracked on the
  stage's tasks.

## German, and adding a language

German texts are written, not translated word for word: plain, warm
German with "du", never "Sie"; "du könntest", "wenn du magst", never
"du musst", "du solltest" or "nicht vergessen"; a miss is "eine Lücke"
or "ein Tag Pause", never "verpasst", "versäumt", "Fehler" or
"Rückfall"; the fallback is "der kleinere Schritt". A claim about
research is exactly as strong as in English. `npm run journeys` checks
German with its own word lists (`packages/engine/src/wording.ts`).

To add a language (for example `fr`):

1. Copy `content/i18n/en.json` to `content/i18n/fr.json` and write every
   text; keep each `{placeholder}`. `ui.grammar.*` are regular
   expressions for the build's words, `ui.plan.*` whole sentences, so
   the language orders the parts as it needs.
2. Add a `fr` block to every journey in `content/journeys/` and to
   `content/examples/`; if the plan sentence needs the action in
   another form, list the language in `PLAN_FORM_LANGUAGES` and write
   the `.plan` texts.
3. Add the language's controlling, blaming and day-promising words to
   `BANNED` in `packages/engine/src/wording.ts`, with tests in
   `packages/engine/test/content-check.test.ts`.
4. Register the table in `packages/plugin/src/shared/languages.ts`
   (`UI_TEXTS`), the start texts' language in `START_LANGUAGES`
   (`packages/plugin/view-content.mjs`), the date locale in
   `packages/plugin/src/ui/journey/format.ts`, and the new language in
   the test that lists the tables (`packages/engine/test/content.test.ts`).
5. Check the screens with `node screenshots.mjs <demos> 1 fr`
   ([development](development.md)): no cut-off text, no horizontal
   overflow. Then `npm run check`; keep `index.html` within its limit.

## Check it

You need Node.js 22 or newer.

```sh
npm ci
npm run journeys
```

`npm run journeys` checks every journey file against the schema and the
rules above and prints errors (must be fixed) and warnings (look at
them). The pull request runs the same check plus all other tests
(`npm run check`). An agent can repeat write → check → fix until it is
clean.

## Publish it

1. Fork the repository and add `content/journeys/<id>.json`.
2. Open a pull request with the journey template: append
   `?template=journey.md` to the compare URL, or copy
   [`.github/PULL_REQUEST_TEMPLATE/journey.md`](../.github/PULL_REQUEST_TEMPLATE/journey.md).
3. Say what the journey is for, list the sources it rests on, and
   confirm the licence statement.
4. The owner reviews: does it help people build the habit, is it kind,
   is it honest? Changes may be asked for. Merging is the owner's choice.

## Licence

Journey files in `content/journeys/` and `content/examples/` are under
[CC BY-SA 4.0](../content/LICENSE): anyone may use and change them if
they name the author and share changes under the same licence. By
opening a pull request you confirm that you wrote the journey yourself
(alone or with an AI agent you directed), that it copies nobody else's
text, and that you publish it under CC BY-SA 4.0. The app shows your
`author` name; that is the attribution.

## For agents

- Work only from this page, the schema and the example; do not invent
  research. If you cite a study, give its DOI or link.
- Write in English first, then German (`texts.de`, with the `.plan`
  forms) along the rules above; other languages are welcome as extra
  `texts.<lang>` blocks.
- Run `npm run journeys` and fix every error before opening the pull
  request; mention remaining warnings and why they are fine.
- Change no other file unless the owner asks.
