---
type: Decision Record
title: Marker progress is derived as the best day of the stage
description: The marker of a build shows the highest condition progress the current stage has reached on any day since it was accepted; the engine recomputes it from the task history in one pass over the due days, stores nothing, and leaves finished stages to the checkpoints.
tags: [decision, engine, build, valley, data]
generated: { by: claude-code/2.1.322, at: 2026-11-12 }
sources:
  - id: issue99
    title: 'Engine and story format: the build of a journey (#99)'
    url: https://github.com/nexumia-de/quest-arc/issues/99
  - id: issue42
    title: 'The Valley: every journey builds one thing, whole at every stage (#42)'
    url: https://github.com/nexumia-de/quest-arc/issues/42
---

# Marker progress is derived as the best day of the stage

Issue #99[^issue99], from the owner's marker rule in #42[^issue42]
(2026-11-12): the marker grows element by element from the **best**
progress reached in the stage and never loses an element. The rule is in
the [game rules](../game-rules.md) §7.

## Problem

The stage's condition progress (§4) can fall: with `days` n of m, a
completion leaves the window when it moves on. The marker must not fall
with it (design rule 12, no falling display). Architecture rule 1 says
derive, don't count: no stored counter unless deriving cannot work.

## Options

1. **Derive:** for every day `d` since the stage was accepted, evaluate
   the condition with the due days and completions up to `d`, and take
   the highest value.
2. **Store a high-water mark:** a record per stage, raised by the host
   whenever the derived progress is higher, and the engine takes the
   larger of record and derivation.
3. **Both:** derive, and also store a mark as a checkpoint against
   deleted history.

## Decision

Option 1. The engine computes the marker progress from the task data on
every evaluation (`bestProgress`, `packages/engine/src/conditions.ts`):

- `days`: one pass over the stage's due days with a sliding window of the
  last `of` due days, keeping the largest number of completions in it.
  The due days and credited completions are the ones the timeline
  already computes, so nothing else is read.
- `count` and `time_spent` only add up, so their best value is today's.

Nothing is stored. Finished stages need nothing new: the version of the
build is 1 + the stages with a checkpoint, which already survive deleted
history ([deleted history](deleted-history.md)), and the marker starts
again at 0 with every stage.

## Why

- **The window case is fully derivable.** The completions that left the
  window are still in the task history (live or archived); only the
  window moved. The best day can be recomputed exactly, in Node and gjs
  alike, so architecture rule 1 needs no exception.
- **Cheap.** It is linear in the stage's due days and reads no task.
  Measured on 2026-11-12 in Node 22 (x86 cloud container): one call
  over 1,800 due days takes about 0.05 ms; evaluating the large archive
  of #92's speed test (about 50,000 archived tasks, a stage with 1,800
  days of history, condition changed to `days` 5 of 7) took 5.1 ms on
  this branch and 5.1 ms on `main`, best of 15, so the difference is
  below the noise. The speed work of #92 filters tasks before the engine
  sees them; this pass does not depend on the number of tasks at all.
- **Undo stays honest.** A completion ticked off by mistake and undone
  takes its element back (vector `build-undo-takes-back`). A stored mark
  (option 2) would keep it forever, showing something that never
  happened.
- **No write on every completion.** Hosts write records only on user
  actions; option 2 would need a write each time the marker grows, and
  with last-writer-wins sync an older device could still lower the
  stored value.

## What is not protected, and why that is accepted

The engine cannot recompute what is gone. In the **current** stage these
user actions lower the marker progress, exactly as they lower the
stage's progress, completions and the seven day marks today:

- deleting a done instance of the stage's task (Super Productivity never
  deletes a done instance by itself: its clean-up keeps done instances
  and instances with time spent, see
  [Super Productivity facts](../super-productivity-facts.md) §5);
- deleting the repeat config (the stage is unbound until a task is bound
  again, which starts counting anew);
- binding another task to the stage (counting starts on the binding day);
- changing the repeat schedule, skipping occurrences or withdrawing a
  pause record afterwards (the due days of the past change).

The [deleted history](deleted-history.md) decision already accepts this
for open progress ("only open progress is derived"), and the marker
belongs to the open stage. Protecting it would need option 2 and bring
back its two faults; if the owner wants it anyway, the smallest form is a
record `marker:<runId>:<stageId>` `{ progress }` written by the host when
the `event.build-element` event fires, read as a floor.

## Consequences

- `BuildView.markerProgress` is the best progress, `ready` is the present
  (`met`); a met stage that falls below its condition keeps its marker
  and loses ready (vector `build-window-moves-on`).
- The vectors `build-window-moves-on`, `build-window-best-day`,
  `build-window-partial-best`, `build-window-slides`,
  `build-undo-takes-back` and `build-deleted-history` hold the rule.

[^issue99]: <https://github.com/nexumia-de/quest-arc/issues/99>

[^issue42]: <https://github.com/nexumia-de/quest-arc/issues/42>
