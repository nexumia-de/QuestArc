# Fix: Sequential Task Loading Robustness

## Goal Description

Currently, the Sequential Task Loading logic relies on counting _all_ root tasks in the active project to determine which task to load next from the template. This breaks if the user creates manual tasks in the project (changing the count).

This fix implements a robust `sourceIndex` tracking mechanism. When a task is cloned from a template, we will store its original index (0, 1, 2...) in its metadata. Upon completion, we simply load `soourceIndex + 1`, ignoring any extra tasks in the project.

## Proposed Changes

### [Data Model]

#### [MODIFY] [src/types/quest-v2.ts](file:///home/deck/Projects/QuestArc/src/types/quest-v2.ts)

- Add `sourceIndex?: number;` to `QuestTaskData['meta']`.

### [Services]

#### [MODIFY] [src/services/compiler.service.ts](file:///home/deck/Projects/QuestArc/src/services/compiler.service.ts)

- Update `cloneTask` signature to accept `sourceIndex`.
- In `compileQuest`: Pass `0` when cloning the first root task.
- In `compileNextTask`: Pass `targetIndex` when cloning the next task.
- In `cloneTask`: Inject `sourceIndex` into the `QuestTaskData` meta block stored in the task notes.

### [Handlers]

#### [MODIFY] [src/handlers/TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)

- In `handle`:
  - Parse `QuestTaskData` from the completed task.
  - Check if `sourceIndex` exists.
  - If yes: Use `sourceIndex + 1` as the index to load.
  - If no: Fallback to existing `createdCount` logic (for backward compatibility).

## Verification Plan

### Automated Tests

- [ ] Create `src/lib/game-logic-sequential.test.ts` (Integration-like test logic)
  - Verify that `sourceIndex` is correctly injected by checking `CompilerService` output logic (mocked).
  - But since we don't have easy integration tests for Services -> We will verify via manual reproduction of the issue.

### Manual Verification

1. Create a Template Project "Test Seq" with 3 root tasks: A, B, C.
2. Start Quest "Test Seq".
   - Task A created.
3. **Crucial Step**: Manually create a new task "Random Task" in the active quest project.
   - Now project has: A, Random Task.
4. Complete Task A.
   - Expected: Task B is created (Index 1).
   - _Previous Bug_: Random Task would cause count=2, so it would try to load Index 2 (C) or fail.
5. Complete Task B.
   - Expected: Task C is created.
6. Complete Task C.
   - Quest Completes.
