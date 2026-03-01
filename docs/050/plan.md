# Plan: Fix Task Creation Button Behavior

## Goal

Fix the bug where the "Add Tasks" button adds _all_ tasks, including those already automatically created.
The button should only add manual tasks (tasks where `isAutoCreate` is false) that haven't been created yet.

## User Review Required

None.

## Proposed Changes

### Logic

#### [MODIFY] [TaskService.ts](file:///home/deck/Projects/QuestArc/src/services/TaskService.ts)

- Update `createTasksForStep` method.
- Logic update:
  - If `force` is true (button click), ONLY create tasks where `isAutoCreate` is false.
  - If `force` is false (initial step load), ONLY create tasks where `isAutoCreate` is true.

## Verification Plan

### Manual Verification

1.  Create a story with a step having:
    - Task A (Auto-create)
    - Task B (Manual)
2.  Start the quest.
    - Verify Task A is created automatically.
    - Verify Task B is NOT created.
    - Verify "Add tasks to your list" button is visible.
3.  Click "Add tasks to your list" button.
    - Verify Task B is created.
    - Verify Task A is **NOT** created again (check task list/logs).
    - Verify button disappears.
