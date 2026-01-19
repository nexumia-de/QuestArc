# Worklog: Fix Grind Task Completion Logic

## Context
The user reported that Grind tasks were being unchecked (reverted to "todo") even when the target count was reached (e.g., 3/3). This was causing confusion as completed tasks appeared to be incomplete.

## Investigation
1.  **Reproduction**: Created `src/lib/game-logic.grind-completion.test.ts` where a task with `current: 2, target: 3` was completed. The test expected `isDone` to be `true` (or at least not `false`), but it failed.
2.  **Root Cause**: In `src/lib/game-logic.ts`, inside the `if (current < target)` block, `taskUpdates` was hardcoded to `isDone: false`. This object was created *before* the check `if (newCurrent < target)`. When `newCurrent === target`, the code fell through to the standard completion block, but it carried the `taskUpdates` object with `isDone: false`, forcing the task to uncheck.

## Changes
1.  **Refactored `processTaskCompletion` in `src/lib/game-logic.ts`**:
    *   Calculated `isFinished = newCurrent >= target`.
    *   Set `taskUpdates.isDone` dynamically based on `isFinished`.
    *   If `isFinished` is true, `isDone` is set to `true`, preserving the user's "check" action.

## Verification
- `npx vitest run src/lib/game-logic.grind-completion.test.ts` -> **Passed**.
- Confirmed that tasks reaching their target count now remain checked.
