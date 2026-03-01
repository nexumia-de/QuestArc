# Worklog - Fix Issue #8

## 1. Analysis

- **Issue**: [BUG] auto close of tasks works globally #8
- **Observation**: The `TaskCompletionHandler` was blindly checking if a task had a parent and if all siblings were done, then auto-completing the parent. This logic was running for ALL tasks, not just QuestArc ones.
- **Root Cause**: Missing `isQuestTask` guard in the auto-completion block.

## 2. Implementation

- **File**: `src/handlers/TaskCompletionHandler.ts`
- **Change**: Added `if (isQuestTask && ...)` to the auto-finish block.

## 3. Verification

- **Build**: `npm run build` passed.
- **Lint**: `npm run lint` passed.
- **Manual Test Plan**:
  - Created a task with subtasks in a normal project -> Parent stayed open.
  - Verified code logic ensures only `🧭` projects trigger the auto-close.
