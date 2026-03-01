# Worklog: Structure Enforcement Logic (ID: 097)

## Changes Implemented

1.  **Scope Guard**: Logic only triggers if the completed task belongs to the **Active Quest Project**.
2.  **Parent Block**:
    - Intercepts completion of any task with open subtasks.
    - Immediately reverts the checkmark (`isDone: false`).
    - Shows error: "⛔ [Quest] Step incomplete! Finish all subtasks first."
3.  **Parent Auto-Finish**:
    - When a subtask completes, checks if it was the _last open subtask_ of its parent.
    - If so, automatically marks the parent task as completed.
    - Notify: "✅ [Quest] Step Completed!"

## Verification

- **Manual Verification**:
  - **Scope Test**: Verified Inbox tasks still behave normally (no blocking).
  - **Block Test**:
    1.  Started Quest.
    2.  Tried to tick a "Step" parent task.
    3.  Result: Blocked + Notification.
  - **Auto-Finish Test**:
    1.  Finished all tasks in a Step.
    2.  Result: Parent Step automatically checked off.
