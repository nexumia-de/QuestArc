# Worklog: Fix Grind Task Progress Logic

## Context

The user reported that Grind tasks were not updating their progress count in the `notes` JSON field, nor were they unchecking themselves after being checked. This indicated a failure in the logic responsible for processing task completion events and writing back updates.

## Investigation

1.  **Reproduction**: Created a reproduction test `src/lib/game-logic.grind.test.ts`. This test passed successfully when `currentStep` was provided, indicating the _core logic_ for calculating updates was correct.
2.  **Failure Analysis**: Investigated `TaskCompletionHandler.test.ts` and found it failed when the mock state was "broken" (missing `activeStory.id`). This caused `getCurrentStep(state)` to return `undefined`.
3.  **Root Cause**: `TaskCompletionHandler` was designed to abort immediately if `getCurrentStep` failed. This meant if the app state was slightly desynchronized (or if the task was effectively orphan), the logical updates for the task itself (which are self-contained in its notes) were never executed.

## Changes

1.  **Refactored `processTaskCompletion` in `src/lib/game-logic.ts`**:
    - Changed `currentStep` parameter to be optional (`StoryStep | undefined`).
    - Added guards to prevent accessing `currentStep` properties (like `tasksToCreate`, `completion`) if it is missing.
    - Allowed the function to return `taskUpdates` (for Grind/Habit) even if it cannot calculate Step completion or Boss damage.

2.  **Updated `TaskCompletionHandler` in `src/handlers/TaskCompletionHandler.ts`**:
    - Removed the early return when `currentStep` is not found.
    - Added logging to indicate independent task processing.
    - Updated conditional logic to ensure step completion/boss logic is only attempted if `currentStep` exists.

3.  **Updated Tests**:
    - Modified `TaskCompletionHandler.test.ts` to simulate a state with no active story ID.
    - Verified that `PluginAPI.updateTask` is still called with the correct `current: 1` and `isDone: false` payload.

## Verification

- `npx vitest run src/handlers/TaskCompletionHandler.test.ts` -> **Passed**.
- Confirmed that the handler is now robust against missing context.
