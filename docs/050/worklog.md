# Worklog: Fix Task Creation Button Behavior

## Changes

- Modified `TaskService.ts` to implement strict separation for task creation:
  - When `createTasksForStep(step, false)` (Initial load): Only creates tasks with `isAutoCreate: true`.
  - When `createTasksForStep(step, true)` (Button click): Only creates tasks with `isAutoCreate: false`.

## Verification

- Run `npm run build`: **Passed**
- Logic verification:
  - `force=false` (start quest) -> Skips manual tasks -> `allCreated=false` -> Button appears. Correct.
  - `force=false` -> Creates auto tasks. Correct.
  - `force=true` (click button) -> Skips auto tasks (prevents duplication). Correct.
  - `force=true` -> Creates manual tasks. Correct.
  - `force=true` -> `allCreated=true` (since manual tasks created, auto previously created). Correct.

## Deviations

None.
