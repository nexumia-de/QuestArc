# 088 - Subtask Quest Logic Update

## Goal Description

Refactor `#QuestArc` tag handling to improve subtask support.

1.  **Stop adding `#QuestArc` to subtasks** explicitly in the Compiler Service. This keeps subtasks clean.
2.  **Update Game Logic** to allow subtasks to deal damage if their **parent task** is part of a generic `#QuestArc` quest (i.e. has the tag).

## Proposed Changes

### Logic Layer (`src/lib/game-logic.ts`)

- Update `processTaskCompletion` signature to accept an optional `parentTask: TaskStub`.
- Modify the damage check logic:
  - Allow damage if `_task.title` OR `parentTask.title` contains `#QuestArc`.

### Service Layer (`src/services/compiler.service.ts`)

- Update `cloneTask` method.
- Condition the addition of `#QuestArc` string to `title`. Only add it if `parentId` is null (root tasks).

### Handler Layer (`src/handlers/TaskCompletionHandler.ts`)

- Update `handle` method.
- If `task.parentId` exists, fetch the parent task using `PluginService.api`.
- Pass the `parentTask` to `processTaskCompletion`.

## Verification Plan

### Automated Tests

- Update `src/lib/game-logic.test.ts` (or create new test) to verify subtask damage logic.
  - Case 1: Subtask without tag, Parent with tag -> Should deal damage.
  - Case 2: Subtask without tag, Parent without tag -> Should NOT deal damage.
  - Case 3: Root task with tag -> Should deal damage.

### Manual Verification

1.  Create a "Page" (Template) with a Main Task and Subtasks.
2.  Start Quest.
3.  Verify Main Task has `#QuestArc` and Subtasks do not.
4.  Complete a Subtask.
5.  Verify Boss takes damage.
