---
type: Decision Record
title: A data format number on the record that needs it
description: Two hosts on different engine versions share the choice records; a dataFormat field on the run-scoped record whose meaning an older engine would get wrong makes that run read-only there, unknown kinds and fields are ignored and kept, and guardWrite stops older hosts from writing into such a run.
tags: [decision, engine, data, sync, pensum]
generated: { by: claude-code/2.1.318, at: 2026-11-12 }
sources:
  - id: issue
    title: 'Two hosts on different engine versions: rule for unknown records and journeys (#85)'
    url: https://github.com/nexumia-de/QuestArc/issues/85
---

# A data format number on the record that needs it

Issue #85[^issue], decided by best practice as the owner asked
(2026-11-12). The rule is in the [data model](../data-model.md) §2,
"Data format and unknown data".

## Problem

The plugin and Pensum share the choice records but are released
separately: Pensum pins an engine archive while the plugin in Super
Productivity can be newer or older. Without a rule an older engine shows
wrong progress for records it does not understand (graduation, a real
step back), drops a run whose journey it does not have, or writes a
record the newer engine reads as a contradiction. Until now the engine
reported every unknown record kind as a problem.

## Options

1. **Ignore unknown data, nothing else.** Smallest, but an older engine
   cannot tell that a graduation changed what a run means, so it shows
   wrong progress and keeps writing into the run.
2. **Treat every unknown kind as "too new".** Needs no number, but any
   harmless addition (a note, a reminder setting) would block older
   hosts. Too coarse.
3. **One format number in the `settings` record.** Blocks every run, not
   only the one that changed, and `settings` is last-writer-wins, so an
   older host that changes the mode would erase the marker.
4. **A `format` field on the `run` record**, raised when the run gets
   such a record (the example in the issue). Needs a rewrite of a record
   that is otherwise written once, from the device that adds the new
   record; withdrawing the new record (undo) does not lower it; the name
   collides with `format` on `journey:` records (the story format), so a
   reader of "format above 1 means too new" would misread every imported
   journey.
5. **`dataFormat` on the run-scoped record that needs it.** The record
   that changes the meaning carries the number; the older engine finds
   the run from the key (`<kind>:<runId>:…`, true for every run record
   today). No rewrite, undo restores the old format, other runs stay
   usable.

## Decision

Option 5, with the engine constant `DATA_FORMAT = 1`:

- a run-scoped record with `dataFormat` above the engine's makes its run
  read-only ("written by a newer QuestArc"); the same holds when the
  run's journey, or the run's journey version, is not available;
- a read-only run keeps its place among the runs (from its `run`,
  `pause` and `run-end` records, which every engine understands) and is
  listed in the view's `readOnly` with the reason; hosts show a calm
  read-only page and write nothing for it;
- unknown kinds and fields are ignored without a problem and are never
  withdrawn or rewritten; `guardWrite(view, changes)` refuses a whole
  change that touches a read-only run or a kind the engine does not
  write;
- `DATA_FORMAT` rises only for a record whose meaning an older engine
  would get wrong; new optional fields and ignorable kinds keep format 1.

## Consequences

- The first record that needed it is the checkpoint of 3.3 (#110): it
  lost `xp` and `damage`, which an engine before 3.3 requires, so it
  carries `dataFormat: 2` and `DATA_FORMAT` is 2. A run continued with
  3.3 is read-only on an older QuestArc until that is updated; old
  checkpoints are still read. Graduation (#22) will take the next
  number if it needs one.
- The second is the skip record (#81): an engine that does not know skipping (3.3 and older) would keep
  working on a skipped stage, so `skip` carries `dataFormat: 3` and
  `DATA_FORMAT` is 3. A record carries the format that first gave it its
  meaning: checkpoints still say 2, so only a run with a skip is
  read-only on a 3.3 host, and taking the skip back makes it usable
  there again. `stay` only quiets an offer and carries no format.
- The pairing record (`pair`, #58) holds only the user's words for the
  plan sentence. An engine that does not know it computes the same run
  and shows the plan without them, so it carries no format; an older
  host cannot write it (`guardWrite`) and keeps it untouched. The same
  holds for the plan check (`plan-check`, #59): the user's four answers,
  shown and never evaluated. It became a record of its own instead of
  the `woop` field once planned for `run`, so a later change does not
  rewrite the record every engine places a run by.
- A read-only run shows no progress on the older host until it is
  updated; the read-only page says to update.
- Pensum must keep unknown `questarc:` entries, call `guardWrite` through
  `engine-cli.mjs` and show the read-only page (follow-up issue in
  Pensum).
- The vectors `unknown-records-kept`, `newer-format-read-only`,
  `journey-version-missing` and `guard-write` hold the rule.

[^issue]: <https://github.com/nexumia-de/QuestArc/issues/85>
