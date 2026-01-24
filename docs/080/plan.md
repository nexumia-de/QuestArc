# Code Review & Refactoring: Logic Deduplication & Cleanup

## Goal
Improve code maintainability and cleanliness by:
1. Deduplicating task title formatting and parsing logic across `game-logic.ts`, `parsers.ts`, and `TaskService.ts`.
2. Splitting the monolithic `processTaskCompletion` function in `game-logic.ts`.
3. Standardizing task creation logic in `TaskService.ts`.

## Proposed Changes

### 1. `src/lib/parsers.ts`
- [NEW] `formatTaskTitle(baseTitle: string, progress?: QuestTaskProgress, streak?: QuestTaskStreak): string`
  - Centralizes the logic for appending `(current/target)` and `🔥 streak`.
- [NEW] `cleanTaskTitle(title: string): string`
  - Centralizes the logic for stripping status suffixes to find the "base" title.

### 2. `src/lib/game-logic.ts`
- [REFACTOR] `processTaskCompletion`:
    - Extract `handleGrindCompletion(...)`
    - Extract `handleHabitCompletion(...)`
    - Use `formatTaskTitle` for generating new titles.
    - Use `cleanTaskTitle` for matching parent steps.

### 3. `src/services/TaskService.ts`
- [REFACTOR] `checkDailyResets`: Use `formatTaskTitle` and `cleanTaskTitle` to standardize reset logic.
- [REFACTOR] `createTasksForStep` & `createNextTask`: Extract common task payload creation logic to `prepareTaskPayload`.

## Verification
- Run `npm test` to ensure no regressions in game logic.
- Manual verification not strictly required as existing tests cover these flows, but will run them.
