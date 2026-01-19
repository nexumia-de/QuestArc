# Plan: Fix Grind Task Progress Logic

## Problem
The user reported that "Grind" tasks (e.g. "Multi 3x") are not updating their progress (current count) or unchecking correctly after completion.
Debug investigation revealed that `TaskCompletionHandler` was failing silently when `getCurrentStep(state)` returned `undefined`. This can happen if the active story state is desynchronized or if the task is being processed outside of a valid quest step context.

## Goal
Ensure that Grind and Habit tasks can consistently update their own internal state (progress counters, notes) even if the global Quest Step context is missing or invalid.

## Proposed Changes
1.  **Refactor `processTaskCompletion` (src/lib/game-logic.ts)**
    *   Make `currentStep` argument optional.
    *   Guard logic that depends on `currentStep` (XP calculation from step settings, Step completion checks).
    *   Allow logic that depends only on `task` (Metadata parsing, Grind/Habit counter updates) to proceed without `currentStep`.

2.  **Update `TaskCompletionHandler` (src/handlers/TaskCompletionHandler.ts)**
    *   Remove the early return when `getCurrentStep` returns `undefined`.
    *   Log a specific message indicating independent processing.
    *   Pass `undefined` to `processTaskCompletion` if step is missing.
    *   Ensure `initializeBossIfNeeded` handles undefined step gracefully (or skipped).

3.  **Verification**
    *   Update strict unit tests to verifying handler proceeds even with broken state (missing Story ID).

## Verification Plan
- Run `TaskCompletionHandler.test.ts` with a mock state that lacks a valid active story ID.
- Expect `PluginAPI.updateTask` to still be called with correct notes updates.
