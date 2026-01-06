# Debug Infinite XP Bug

The infinite XP bug persists despite the previous fix. This suggests `state.activeStory.isCompleted` is not being correctly set or persisted, or the story definition causes an infinite loop (self-referencing next step).

## Analysis
- **Likely Cause 1**: `nextStepId` points to the current step (infinite loop).
- **Likely Cause 2**: `isCompleted` state is lost or not updated.
- **Likely Cause 3**: Race condition or stale state.

## Proposed Changes

### Logic

#### [TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)
- Add comprehensive debug logs to trace `isCompleted` status and step transitions.
- Log `currentStep.nextStepId` to verify if it's null as expected.

#### [game-logic.ts](file:///home/deck/Projects/QuestArc/src/lib/game-logic.ts)
- Modify `processTaskCompletion` to explicitly return `stepCompleted: false` if `state.activeStory.isCompleted` is true (Defense in Depth).

## Verification Plan
- **Manual Verification**: Check logs in console.
- **Inspect Story**: manual review of JSON files.
