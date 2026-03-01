# Phase 3.5: Grind & Habit Mechanics Plan

## Problem

Currently, "Grind" tasks (e.g., "50x Pushups") and "Habit" tasks (e.g., "3x @daily Drink Water") behave like normal tasks. When checked, they are completed and hidden by Super Productivity.
They _should_:

1.  Remain incomplete (`isDone: false`).
2.  Update their title locally (e.g., decrement count or show progress `(1/50)`).
3.  Persist this progress in `task.notes` (inside `QuestTaskData`).

## Proposed Changes

### 1. `src/lib/game-logic.ts`

- **[MODIFY]** `processTaskCompletion`:
  - Change return type to include `taskUpdates?: Partial<Task>`.
  - Logic:
    - Parse `QuestTaskData` from notes (or title regex fallback).
    - If `GRIND`: Increment progress. If `current < target`, return `{ isDone: false, title: ... }`.
    - If `HABIT`: Check frequency. Update `lastDone`. If more reps needed today, return `{ isDone: false }`.

### 2. `src/handlers/task-handler.ts`

- **[MODIFY]** `handleTaskComplete`:
  - Receive `taskUpdates` from game logic.
  - If present, call `PluginAPI.updateTask(taskId, taskUpdates)`.

## Verification

- **Unit Test**: Update `task-handler.test.ts` to mock a Grind task and verify `updateTask` is called with `isDone: false`.
