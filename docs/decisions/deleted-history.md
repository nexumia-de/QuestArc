---
type: Decision Record
title: Finished stages survive deleted history
description: A finished stage is stored as a checkpoint record, so deleting archived tasks or instances never takes back a finished stage or journey; only open progress is derived.
tags: [decision, engine, data, archive]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Finished stages survive deleted history

Issue #49, decided by the owner on 2026-11-05.

## Problem

All progress is derived from tasks. If the user deletes archived tasks,
clears the archive, deletes a single done instance, or deletes a repeat
config (which clears `repeatCfgId` on all its tasks), derived XP, level
and stage progress would drop without warning.

## Options

1. Accept it and explain it.
2. Store a small checkpoint per finished stage.
3. Store all XP (back to counting).

## Decision

Option 2. When the user accepts the next stage (or ends the journey after
its last stage), the plugin (or Pensum) writes a checkpoint record `stage-done:<journeyId>:<stageId>` with the day it was
completed and the XP and guardian damage it earned. The engine then:

- treats a stage with a checkpoint as finished, whatever the tasks say;
- takes XP and damage of finished stages from their checkpoints;
- derives only the **current** stage from tasks.

A finished journey is finished when its last stage has a checkpoint.

## Why

Finished stages and journeys are things the user experienced; losing
them by tidying the archive would feel like punishment, which the
[design rules](../psychology.md) rule out. Open progress stays derived,
so sync conflicts cannot lose it, and two devices writing the same
checkpoint write the same content (last writer wins on one record).

## Consequences

- Between meeting the condition and accepting the next stage, the stage
  is still derived: undoing a completion can take it back below its
  condition. Once accepted, the stage stays finished.
- Checkpoints are the only counted values QuestArc stores; they are
  written once and never incremented.
