# Worklog: Improve Quest Start Flow

## Task ID: 031

## Changes
- **Updated `MessageTypes`**: Added `START_QUEST` and `ADD_STEP_TASKS` types.
- **Updated `MessageHandler`**:
  - Implemented `START_QUEST` handler: switches `activeStory.id` and resets active boss.
  - Implemented `ADD_STEP_TASKS` handler: calls `TaskService.createTasksForStep`.
  - Fix: Unified `state-manager` imports to resolve build warning (statically imported).
- **Updated `App.tsx`**:
  - Added `startQuest` handler (sends `START_QUEST` + `REQUEST_SYNC`).
  - Added `addStepTasks` handler (sends `ADD_STEP_TASKS`).
  - Passed `onStart` to `StoryListView` and `onAddTasks` to `DashboardView`.
- **Updated `StoryListView.tsx`**:
  - Added `onStart` prop.
  - Implemented "Confirm Start" modal when clicking inactive stories.
  - Clicking active story navigates to Dashboard.
- **Updated `DashboardView.tsx`**:
  - Added `onAddTasks` prop.
  - Displayed list of tasks for the current step.
  - Added "Add task to your list" button.
- **Updated `App.css`**:
  - Added `.modal-overlay`, `.modal`, and `.modal-actions` classes to fix inline popup rendering.
  - Fixed `@keyframes` syntax for animations.
  - Aligned boss image to sit correctly on the card border (`top: -40px`).
  - Implemented self-healing logic in `plugin.ts` to restore missing bosses on load.
  - Updated `MessageHandler.ts` to initialize bosses immediately when starting a quest.

## Verification
- Reference: `src/types/messages.ts`, `src/handlers/MessageHandler.ts`, `src/app/App.tsx`, `src/components/StoryListView.tsx`, `src/components/DashboardView.tsx`, `src/app/App.css`
- Build status: **SUCCESS**

## Notes
- The "Start Quest" action currently preserves `currentStepId` if valid, or defaults to 1. It also resets `taskProgress` (empty object) in the update, though the plan discussed persistence. For now, it switches the pointer. If the user had progress on that quest from before (in `taskProgress` inside `stories`), it isn't currently re-hydrated into `activeStory.taskProgress` because `activeStory` is a separate object in state.
- **Improved Logic Needed Later**: We might want to "Hydrate" active story progress from the saved story state if we want to resume exactly where left off, beyond just `currentStepId`. Currently `activeStory` in `QuestArcState` is the source of truth for *progress*.
