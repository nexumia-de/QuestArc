# 089 - Fix Deep Subtask Damage Logic

## Goal Description

Fix the issue where subtasks do not deal damage to the Boss.
The previous implementation only checked the **immediate** parent for the `#QuestArc` tag.
If a subtask is nested (e.g., `Root > Subtask > NestedSubtask`), the immediate parent (`Subtask`) likely does NOT have the tag (since we stripped it in 088).
We must verify the **Root Ancestor** to see if the task belongs to a Quest.

## Proposed Changes

### Handler Layer (`src/handlers/TaskCompletionHandler.ts`)

- Update `handle` method.
- Implement a recursive lookup (while loop) to find the **Root Task** (the task with no `parentId`) for the completed task.
- Pass this `rootTask` to `processTaskCompletion`.

### Logic Layer (`src/lib/game-logic.ts`)

- Rename optional parameter `parentTask` to `rootTask` (or `questOwnerTask`) for clarity.
- Logic remains similar: check `_task` OR `rootTask` for `#QuestArc`.

## Verification Plan

### Automated Tests

- Create a test case with 3-level nesting:
  - `Root #QuestArc` -> `Subtask 1` -> `Subtask 1.1`
- Verify that completing `Subtask 1.1` deals damage.

### Manual Verification

1.  Create a Quest Task `#QuestArc`.
2.  Add a Subtask.
3.  Add a Subtask to that Subtask (making it Level 2).
4.  Start Quest/Boss.
5.  Complete the Level 2 subtask.
6.  Verify Boss takes damage.
