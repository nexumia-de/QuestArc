# Worklog - Multi-Step "Heroic Story" Editor

## 1. Story Data Model Update

- **File**: `src/types/state.ts`
- **Change**: Updated `StoryStep` to allow `nextStepId` to be `null` (explicit end of story).

## 2. Auto-Linking Logic

- **File**: `src/app/App.tsx`
- **Feature**:
  - The Story Editor now automatically links Step N to Step N+1.
  - The final step explicitly sets `nextStepId: null`.

## 3. Dynamic Task Renaming

- **File**: `src/plugin.ts`
- **Feature**:
  - Implement logic in `taskComplete` hook to check for `nextStepId`.
  - Added `PluginAPI.updateTask` call to rename the host task to the next step's title upon completion.
  - This enables the "Habit Stacking" workflow where one completed task evolves into the next.

## verification

- Verified build with `npm run build` (Inlined dependencies successfully).
- Verified story creation flow and data persistence.
