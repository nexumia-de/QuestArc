# Worklog - Task 022: Task-Specific Requirements

## Summary

Shifted step completion logic to be **Task-Specific**. Instead of a generic "Complete any 5 tasks" counter, steps now require specific tasks to be completed a specific number of times.

## Changes

- **Data Model**:
  - `TaskDefinition`: Added `isRequired` (bool) and `requiredCount` (number).
  - `ActiveStory`: Added `taskProgress` (Record<Title, Count>) to track individual task progress.
- **UI**:
  - Added "❗ Required" checkbox and "Target" input to Task Editor.
  - Simplified "Step Goal" selector to `Complete Required Tasks` vs `Defeat Boss`.
- **Logic**:
  - `processTaskCompletion` now matches completed tasks by title.
  - Updates `taskProgress` for the matching task.
  - Step completes only when **ALL** required tasks meet their `requiredCount`.

## Verification

- **Build**: verified via `npm run build`.
- **Logic**: Verified `processTaskCompletion` handles both boss battles and task checklists correctly.
