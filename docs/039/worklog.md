# Task 039: Undo Task Support

## Changes
- Implemented `TaskUndoHandler` in `src/handlers/TaskUndoHandler.ts`.
- Registered `taskUpdate` hook in `src/plugin.ts` to detect when a task is marked undone.
- Logic:
    - Checks if the task has recorded progress in the current story step.
    - If yes, decrements the progress counter.
    - If a boss is active, heals the boss by 10 HP (standard damage amount).
    - Logs the action and shows a snackbar notification.

## Verification
- Verified build success with `npm run build`.
- Manual verification plan:
    1. Complete a task -> Boss takes damage.
    2. Uncheck task -> Boss heals.
    3. Complete level -> Uncheck task -> Should log "No progress recorded" (safe fallback).

## Limitations
- Does not revert XP gain if the undo happens *after* a level-up (step completion clears the progress log).
- Assumes standard damage of 10 for healing.
