# Plan: Sequential Task Loading

## Problem

The "Backlog" approach for hiding future tasks proved unreliable with the host API. The user requested to switch to a **Sequential Loading** model: only the first task of a quest/step is created initially. Subsequent tasks are created ("unlocked") one-by-one as the current task is completed.

## Solution

Implement "Lazy Creation" logic across the system.

1.  **`CompilerService` (Custom Quests/Templates)**:
    - Update `compileQuest` to clone **only the first root task** from the template.
    - Expose a method `cloneNextTask` (or similar) to find and clone the next task from the source template based on the current state.

2.  **`TaskService` (Built-in Quests/Steps)**:
    - Update `createTasksForStep` to create **only the first task** definition.
    - Add logic/method to create the "Next" task given a completed task's title/index.

3.  **`TaskCompletionHandler`**:
    - When a task completes:
      - Check if it was part of a "Sequence" (Custom Quest or Multi-task Step).
      - **If Custom Quest**: Use `CompilerService` to find the (N+1)th task from the original template and clone it.
      - **If Built-in Step**: Use `TaskService` to find the next task definition in `step.tasksToCreate` and create it.
      - **If No Next Task**: Proceed with existing "Step Complete" / "Quest Complete" logic.

## Detailed Changes

### `src/services/compiler.service.ts`

- Modify `compileQuest`:
  - Fetch template tasks.
  - Sort/Identify order (index 0).
  - Clone ONLY index 0.
- Add `public static async compileNextTask(templateId: string, activeProjectId: string, completedTaskCount: number): Promise<boolean>`
  - Fetches template tasks.
  - cloning `templateTasks[completedTaskCount]`.
  - Returns `true` if a task was found and created, `false` if sequence is done.

### `src/services/TaskService.ts`

- Modify `createTasksForStep`:
  - Loop logic: Only create `i === 0`.
  - Returns `true` only if _all_ intended tasks are done (which is false now if >1 exists).
- Add `static async createNextTask(step: StoryStep, completedTaskTitle: string): Promise<boolean>`
  - Find index of `completedTaskTitle` in `step.tasksToCreate`.
  - Create `index + 1`.

### `src/handlers/TaskCompletionHandler.ts`

- Detect Context:
  - **Backlog/Lazy Mode**:
    - Check `state.activeStory.id`.
    - If `startsWith('📜')` (wait, active ID is usually `targetId`... Custom IDs are UUIDs or original template IDs? `CompilerService` returns a new Project ID).
    - We need to know the **Source Template ID**.
    - _Correction_: `QuestManager.startQuest` sets `activeStory.id = targetId`. For Custom Quests, `targetId` IS the Template Project ID (from `scan`).
    - So `state.activeStory.id` IS the Template ID.
- Logic:
  - `const nextFound = await CompilerService.compileNextTask(state.activeStory.id, projectId, currentTaskCount);`
  - If `!nextFound`:
    - Check `TaskService.createNextTask` (for built-ins).
  - If neither found -> Step Complete.

## Verification

- Start Custom Quest -> Verify only 1 task appears.
- Complete Task -> Verify Task 2 appears.
- Complete Last Task -> Verify Quest Complete.
