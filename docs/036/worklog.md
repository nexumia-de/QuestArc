# Worklog: Fix Missing Add Task Button (036)

## Changes

- **TaskService.ts**: Updated `createTasksForStep` to return a `boolean` indicating if _all_ tasks were successfully created (or didn't need creation). Added a `force` parameter to override `isAutoCreate` checks.
- **MessageHandler.ts**: Updated `START_QUEST` to only mark `tasksCreatedForStepId` if `createTasksForStep` returns `true` (indicating no pending manual tasks). Updated `ADD_STEP_TASKS` to force task creation and unconditionally set the flag.
- **TaskCompletionHandler.ts**: Updated step transition logic to respect the return value of `createTasksForStep`.

## Verification

- **Build**: `npm run build` passed successfully.
- **Logic**: Verified that the "Add Tasks" button visibility logic (which depends on `tasksCreatedForStepId` being null) will now correctly function when manual tasks are present.
