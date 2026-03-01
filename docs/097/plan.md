# Implementation Plan - Structure Enforcement Logic (ID: 097)

Implement strictly enforced task structure logic, **scoped ONLY to the Active Quest Project**.

1.  **Block Parent Completion**: Parents cannot be manually completed if they have open subtasks.
2.  **Auto-Finish Parent**: When the last subtask is completed, the parent is automatically marked as done.

## User Review Required

> [!IMPORTANT]
> **Scope Restriction**: These rules only apply to tasks within the currently running **Quest Project**. Your personal tasks in other projects (Inbox, Work, etc.) are unaffected and behave normally.

## Proposed Changes

### Handlers

#### [MODIFY] [TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)

1.  **Parent Completion Guard**:
    - At the start of `handle()`:
    - **Scope Check**: `if (task.projectId !== state.activeStory.id) return;` (Skip logic if not in active quest).
    - Check if the task has `subTaskIds`.
    - If yes:
      - Fetch all tasks.
      - Check if _any_ subtask is `!isDone`.
      - If found:
        - **Block**: Revert `isDone: false`.
        - **Notify**: "⛔ [Quest] Cannot complete step! Finish subtasks first."
        - Return early.

2.  **Auto-Complete Parent**:
    - If the completed task has a `parentId`:
    - **Scope Check**: (Already checked parentId presence, but also check `projectId` context implicitly via `activeStory.id`).
      - Fetch parent.
      - Check if _all_ of parent's subtasks are done.
      - If yes:
        - Update parent: `isDone: true`.
        - Notify: "✅ [Quest] Step completed!"

## Verification Plan

### Manual Verification

1.  **Scope Test**:
    - Go to Inbox. Create Parent/Child task.
    - Check Parent.
    - **Expectation**: Parent completes (Standard behavior).
2.  **Quest Guard Test**:
    - Start Quest.
    - Try to check a "Step" (Parent Task) that has open subtasks.
    - **Expectation**: Blocked. "⛔ [Quest]..." warning.
3.  **Quest Auto-Finish Test**:
    - Finish the last subtask of a Step.
    - **Expectation**: Step (Parent) automatically completes.
