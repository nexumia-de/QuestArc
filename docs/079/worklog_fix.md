# Worklog: Sequential Task Loading Robustness

## Bug
Previously, the plugin counted **all** root tasks in an active quest project to guess which task to load next from the template. If the user added manual tasks to the project, this count would desync (e.g., manual task = count 2 -> tries to load index 2 instead of 1), causing the next valid quest task to be skipped or fail to load.

## Fix
- **Data Model**: Added `sourceIndex` to `QuestTaskData`. This stores the 0-based index of the task in the original template.
- **CompilerService**: When cloning a task, we now inject its `sourceIndex`.
- **TaskCompletionHandler**: When a task completes, we read its `sourceIndex` and explicitly load `sourceIndex + 1`, completely ignoring other unrelated tasks in the project.
- **Fallback**: If `sourceIndex` is missing (legacy tasks), it falls back to the old counting method.

## Verification
- Added `TaskCompletionHandler.sequential.test.ts`.
- Validated cases:
  1. Standard sequential flow (Success).
  2. Mixed flow with random manual tasks added (Success - Manual tasks ignored).
  3. Legacy flow (Success - Fallback to count).

## Files Modified
- `src/handlers/TaskCompletionHandler.ts`
- `src/services/compiler.service.ts`
- `src/types/quest-v2.ts`
- `src/handlers/TaskCompletionHandler.sequential.test.ts` (New)
