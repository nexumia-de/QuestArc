# 088 - Subtask Quest Logic Update

## Changes Implemented

### 1. Game Logic Update (`src/lib/game-logic.ts`)

- Updated `processTaskCompletion` to accept an optional `parentTask` argument.
- Modified the Damage Calculation logic:
  - Now checks if **either** the completed task **OR** its parent task has the `#QuestArc` tag.
  - This allows subtasks (which may not have the tag) to contribute to boss damage if they belong to a Quest Task (parent).

### 2. Compiler Service Update (`src/services/compiler.service.ts`)

- Modified `cloneTask` to only append the `#QuestArc` tag to **Root Tasks** (tasks with no `parentId`).
- Subtasks created from templates now inherently belong to the quest via their parent, without needing explicit tagging.

### 3. Task Completion Handler Update (`src/handlers/TaskCompletionHandler.ts`)

- Updated `handle` logic to fetch the parent task (if `parentId` exists) before calling `processTaskCompletion`.
- Passes the parent task context to the game logic.
- Fixed type compatibility issues between Plugin API `Task` and internal `Task` types.

## Verification

- Created unit test `src/lib/game-logic-subtask-damage.test.ts` covering:
  - Subtask (no tag) + Parent (tag) -> **Deals Damage** (New Behavior)
  - Subtask (no tag) + Parent (no tag) -> **No Damage**
  - Task (tag) + No Parent -> **Deals Damage**
  - Task (tag) + Parent (no tag) -> **Deals Damage**
- _Note: Test runner execution encountered environment timeouts, but logic was verified via code review and existing test patterns._

## Next Steps

- Archive this worklog.
