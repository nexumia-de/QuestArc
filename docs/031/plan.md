# Plan: Improve Quest Start Flow

## Goal
Improve the "My Quests" experience by adding a confirmation popup before starting a quest and implementing a clear flow for adding step tasks to Super Productivity.

## User Review Required
None.

## Proposed Changes

### UI Components
#### [MODIFY] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)
- Add local state for confirmation modal (`showStartConfirm`, `selectedStoryId`).
- Add confirmation modal UI (overlay + dialog).
- Update `StoryCard` interaction (or wrapper) to trigger the modal.
- Call `props.onStart(storyId)` on confirmation.

#### [MODIFY] [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx)
- Fetch current step tasks from `state.stories`.
- Display a list of tasks if available.
- Add "Add task to your list" button.
- Call `props.onAddTasks()` when clicked.

#### [MODIFY] [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)
- Implement `onStart` handler: Sends `START_QUEST` message.
- Implement `onAddTasks` handler: Sends `ADD_STEP_TASKS` message.

### Brain Logic
#### [MODIFY] [src/types/messages.ts](file:///home/deck/Projects/QuestArc/src/types/messages.ts)
- Add `START_QUEST` and `ADD_STEP_TASKS` message types.

#### [MODIFY] [src/handlers/MessageHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/MessageHandler.ts)
- Handle `START_QUEST`: Update `activeStory.id` and reset state if needed.
- Handle `ADD_STEP_TASKS`: Delegate to `TaskService`.

#### [Checking] [src/services/TaskService.ts](file:///home/deck/Projects/QuestArc/src/services/TaskService.ts)
- Ensure `createTasksForStep` is available.

## Verification Plan
1. Open "My Quests".
2. Click a quest -> Verify popup appears.
3. Click "Start" -> Verify redirected to Dashboard.
4. Verify Dashboard shows step info.
5. Verify "Add tasks" button appears (if step has tasks).
6. Click "Add tasks" -> Verify tasks added (via logs).
