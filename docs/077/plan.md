# Plan: Fix Project Backlog Creation

## Problem

The user reported that tasks are not being created in the backlog. Investigation revealed that the `isBacklog: true` property used in `addTask` is not supported by the Super Productivity API. Backlog functionality requires tasks to be associated with a **Project** and explicitly assigned to the `backlogTaskIds` list of that project.

## Solution

1.  **Refactor `TaskService`**:
    - Modify `createTasksForStep` to accept an optional `projectId`.
    - After creating tasks, if a `projectId` is provided AND there are tasks intended for the backlog:
      - Fetch the Project from the API.
      - Move the task IDs from the Project's `taskIds` (Today) list to the `backlogTaskIds` list.
      - Update the Project via `PluginAPI`.

2.  **Update Callers**:
    - `plugin.ts`: Pass the active story ID (if available) as `projectId` when initializing tasks.
    - `MessageHandler.ts`: Pass `storyId` during `START_QUEST` and `activeStory.id` during `ADD_STEP_TASKS`.

## Implementation Details

### `TaskService.ts`

- Update signature: `createTasksForStep(step: Pick<StoryStep, ...>, force: boolean = false, projectId?: string | null)`
- Logic:
  ```typescript
  const backlogIds: string[] = [];
  // ... loop ...
  if (!isFirstTask) {
    // ... addTask ...
    backlogIds.push(newTaskId);
  }
  // ... after loop ...
  if (projectId && backlogIds.length > 0) {
    // Fetch project, update lists
  }
  ```

### `plugin.ts`

- `init()`: `TaskService.createTasksForStep(currentStep, false, state.activeStory.id)`

### `MessageHandler.ts`

- `START_QUEST`: `TaskService.createTasksForStep(startStep, false, storyId)`
- `ADD_STEP_TASKS`: `TaskService.createTasksForStep(currentStep, true, state.activeStory.id)`

## Verification Plan

1.  **Manual Verification**:
    - Start a "Custom Quest" (Project-based).
    - Verify tasks are created.
    - Verify the **first task** is in the "Today" list.
    - Verify **subsequent tasks** appear in the "Backlog" list of the project (user might need to expand backlog to see them).
    - Start a "Built-in Quest" (if applicable, ensuring no crash even if backlog fails).
