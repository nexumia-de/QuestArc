# Worklog - Task 020: Story Editor Enhancements

## Summary
Implemented decoupled task creation and completion requirements in the Story Editor. This allows users to define multiple tasks to be auto-created when a step starts, and separately define what conditions are needed to complete the step (e.g., complete all tasks, complete a specific number of tasks, or defeat a boss).

## Changes
- **Data Model (`src/types/state.ts`)**:
    - Updated `StoryStep` to replace legacy `type`/`condition` fields with `tasksToCreate` (creation) and `completion` (requirements).
    - Added `TaskDefinition` and `CompletionRequirement` interfaces.
- **UI (`src/components/EditorView.tsx`)**:
    - Rewrote the editor to support adding multiple tasks per step with "Auto-create" option.
    - Added a "Completion Requirements" section to configure "Complete All", "Any Count", or "Boss Defeat".
- **Logic (`src/plugin.ts` & `src/lib/game-logic.ts`)**:
    - Implemented `createTasksForStep` to auto-create tasks using `PluginAPI.addTask` when a step begins.
    - Updated `processTaskCompletion` to handle new completion types (`all_tasks`, `any_count`, `boss_defeat`).
    - Updated `initializeBossIfNeeded` to use the new completion config.
- **App (`src/app/App.tsx`)**:
    - Updated `handleSaveStory` to adapt to the new `StoryStep` structure.

## Verification
- Verified code structure handles the new data model.
- Handled TypeScript errors related to interface changes.
- Ensured backward compatibility/migration is not strictly needed for *new* stories (old stories might need migration logic if loaded, but handled gracefully by defaults in Editor).
