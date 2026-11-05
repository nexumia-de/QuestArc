---
type: Decision Record
title: How the plugin sets up a stage's recurring task
description: Super Productivity's plugin API cannot create repeat configs, so the plugin creates the task and hands it to the user to set the repeat, or binds an existing recurring task; an upstream API is requested in parallel.
tags: [decision, plugin, recurring-tasks, super-productivity]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# How the plugin sets up a stage's recurring task

Issue #10, decided by the owner on 2026-11-05.

## Problem

Accepting a stage should give the user a recurring task, e.g. "After
lunch: walk 15 minutes", daily. At Super Productivity master `c5eb3f6`
plugins cannot create or end repeat configs: `PluginCreateTaskData` has
no repeat field, `@every …` in a title from `addTask` creates no repeat
config, and the repeat actions are not in `ALLOWED_PLUGIN_ACTIONS`
([facts](../super-productivity-facts.md)). Pensum can write repeat
configs itself once it supports them.

## Decision

For QuestArc 3.0 the plugin offers two ways, both started by the user:

1. **Create and hand over.** The plugin creates a normal task with the
   stage's plan as title (short syntax off), opens it with
   `selectTask`, and asks the user to set the repeat with one tap in
   Super Productivity's own dialog. The suggested repeat (daily,
   weekdays, …) is shown next to the request.
2. **Bind an existing task.** The user picks a recurring task they
   already have ("Use for current stage" in the task context menu, or a
   picker in the stage dialog).

In both cases the stage is bound when the task has a `repeatCfgId`; the
binding is a choice record holding the task id and the repeat config id.

In parallel the owner proposes a plugin API for repeat configs to Super
Productivity (#41). When it is released, the plugin creates the repeat
config itself and keeps the two ways above as fallback for older
versions.

## Consequences

- Until the repeat is set, the stage waits ("Set how often you want to
  do this") and gives no progress.
- Deleting a repeat config clears `repeatCfgId` on all its tasks. The
  stage then becomes unbound and asks to bind a task again; finished
  stages are kept ([deleted history](deleted-history.md)).
- Moving to the next stage: the previous stage's recurring task stays
  the user's. The plugin suggests ending or changing it (in Super
  Productivity's dialog) so the user does not keep two versions of the
  same habit; it never ends it itself.
- Pensum creates repeat configs directly with its own repeating-task
  code and writes the same binding record.
