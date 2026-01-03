# Bug Fix: Missing Boss in Stories (035)

## Goal
Fix a bug where bosses are not rendered when a story step contains a boss. This happens because the boss initialization logic might be missing during the step transition.

## User Review Required
None.

## Proposed Changes
### Logic
- **`src/handlers/TaskCompletionHandler.ts`**:
    - When a step is completed and we move to the next step, we must call `initializeBossIfNeeded` for the *new* step.
    - Currently, it might only be checking the *old* step or not calling it at all after transition.

### `src/handlers/TaskCompletionHandler.ts`
#### [MODIFY] [TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)
- Import `initializeBossIfNeeded`.
- After updating `currentStepId` to the next step, get the new step definition.
- Call `initializeBossIfNeeded` with the new step and update the state.

## Verification Plan
### Manual Verification
1.  **Create a Story with a Boss**:
    - Use the Story Creator to make a story.
    - Step 1: Simple task.
    - Step 2: Boss battle (ensure "Boss Defeat" is selected).
2.  **Play the Story**:
    - Complete Step 1.
    - Verify that Step 2 loads and the Boss rendered in the dashboard.
