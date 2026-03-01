# 089 - Fix Deep Subtask Damage Logic

## Changes Implemented

### 1. Handler Layer (`src/handlers/TaskCompletionHandler.ts`)

- Refactored parent lookup logic.
- Implemented a `while` loop to traverse up the `parentId` chain until the **Root Task** (task with no parent) is found.
- Passes this `rootTask` (instead of the immediate parent) to the game logic.

### 2. Logic Layer (`src/lib/game-logic.ts`)

- Renamed `parentTask` argument to `rootTask` in `processTaskCompletion`.
- Updated damage check to verify if `_task` OR `rootTask` contains `#QuestArc`.

## Verification

- Updated `src/lib/game-logic-subtask-damage.test.ts` to include:
  - **Deep Subtask Test:** Nested subtask (no tag) + Root Ancestor (tag) -> **Deals Damage**.
  - **Negative Test:** Nested subtask (no tag) + Root Ancestor (no tag) -> **No Damage**.

## Result

- Subtasks at any depth will now correctly trigger boss damage if their original quest root task was tagged with `#QuestArc`.
