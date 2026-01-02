# Worklog - Task 021: Routine & Repeat Task Support

## Summary
Enabled the creation of **Repeating Tasks** (Routines) directly from the Story Editor. This allows users to set up daily or weekly habits as part of their quest steps. We leverage the host application's existing repeat logic by passing a configuration object during task creation.

## Changes
- **Data Model (`src/types/state.ts`)**:
    - Added `isRepeating` (boolean) and `repeatCfg` (object) to `TaskDefinition`.
- **UI (`src/components/EditorView.tsx`)**:
    - Added a "🔁 Repeat" checkbox to the Task Editor row.
    - Added a dropdown to select frequency ("Every Day", "Every Week") when repeat is enabled.
- **Logic (`src/plugin.ts`)**:
    - Updated `createTasksForStep` to check for `isRepeating`.
    - Constructs a valid `taskRepeatCfg` object (with `startDate` set to today) and passes it to `PluginAPI.addTask`.

## Verification
- **Code Check**: Verified `plugin.ts` correctly constructs the payload expected by Super Productivity's `addTask` method (assuming generic `additionalFields` support).
- **UI Check**: Verified the editor allows toggling report and selecting frequency.
- **Build**: Passes `npm run build`.
