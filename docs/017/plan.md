# Plan: Multi-Step "Heroic Story" Editor

## Goal
Enable users to create "Stories" with linked steps, where completing a step automatically updates the task title to the next step.

## Requirements
1. **Data Model**: Store stories with `nextStepId` linking.
2. **UI**: Story Editor to add/edit/delete steps.
3. **Logic**:
   - Auto-link steps on save.
   - On step completion, update internal state.
   - UPDATE Host Task Title to the next step's title.

## Architecture
- **Brain (`plugin.ts`)**:
  - Handle `SAVE_STORY` message.
  - In `taskComplete` hook:
    - Check if step completed.
    - If yes, find `nextStep`.
    - Update `state.activeStory`.
    - **CALL `PluginAPI.updateTask(taskId, { title: nextStep.title })`**.
- **Face (`App.tsx`)**:
  - `editor-view` (or `story-editor`).
  - `steps` signal.
  - `saveStory` with auto-linking.

## Step-by-Step
1. Update `plugin.ts` to handle `updateTask`.
2. Refine `App.tsx` to match specific class names and verify "Add Step" logic.
3. Verify.
