# 108 – Remove Auto-Scheduling Logic

## Problem

Tasks and subtasks created by QuestArc were being scheduled to today's date due to an undocumented `taskRepeatCfg` field (with `startDate` set to today) passed to `addTask`.

## Changes

- **`TaskService.ts`**: Removed `taskRepeatCfg` block from `prepareTaskPayload`.
- **`state.ts`**: Removed `isRepeating` and `repeatCfg` from `TaskDefinition`.
- **`getting-started.json`**: Removed `isRepeating`/`repeatCfg` from story data.
