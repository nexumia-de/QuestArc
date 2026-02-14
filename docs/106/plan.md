# Fix Issue #8: Global Auto-Close Bug

## Goal Description
Fix a bug where finishing the last subtask of *any* task in Super Productivity causes the parent task to auto-complete. This behavior should be restricted to QuestArc Active Quests (`🧭`) only.

## Proposed Changes

### Logic Handler
#### [MODIFY] [TaskCompletionHandler.ts](../../src/handlers/TaskCompletionHandler.ts)
- Update the "AUTO-FINISH PARENT" block to explicitly check if `isQuestTask` is true.
- This uses the existing `isQuestTask` boolean calculated earlier in the handler, which verifies if the task's project title contains `🧭`.

## Verification Plan

### Manual Verification
1.  **Non-Quest Task**:
    -   Create a standard Project (no `🧭` icon).
    -   Create a Task with 2 Subtasks.
    -   Complete both Subtasks.
    -   **Result**: Parent task remains Open.
2.  **Quest Task**:
    -   Start a Quest (creating a `... 🧭` project).
    -   Find/Create a step with subtasks.
    -   Complete all subtasks.
    -   **Result**: Parent task Auto-Completes.
