# 009: Implement "Habit Stacker" Story Editor

## Goal Description

Implement a "Story Editor" that allows users to create custom habit-stacking stories directly within the plugin UI. This includes a new Editor view in the frontend and logic in the backend (plugin.ts) to validate and persist the new stories.

## User Review Required

None.

## Proposed Changes

### Shared Types

#### [MODIFY] [messages.ts](file:///home/deck/Projects/QuestArc/src/types/messages.ts)

- Add `SAVE_STORY` to `MESSAGE_TYPES`.
- Add `SaveStoryMessage` interface.

### Backend (The Brain)

#### [MODIFY] [plugin.ts](file:///home/deck/Projects/QuestArc/src/plugin.ts)

- Add `SAVE_STORY` to local `MESSAGE_TYPES`.
- implementations `SAVE_STORY` handler in `onMessage`:
  - Validate `newStory` payload (id, title, steps).
  - Add or update story in `state.stories`.
  - Persist state.
  - Return success/failure response.

### Frontend (The Face)

#### [MODIFY] [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)

- Add state for `view` (dashboard vs editor).
- Add state for `newStep` form data.
- Implement `saveStory` function to send `SAVE_STORY` message.
- Add Editor UI section (toggleable).

#### [MODIFY] [App.css](file:///home/deck/Projects/QuestArc/src/app/App.css)

- Add styles for the editor form (inputs, buttons).

## Verification Plan

### Manual Verification

1.  Open QuestArc UI.
2.  Click "New Quest" to open Editor.
3.  Fill in "Task Name", "Streak Goal", "XP Reward".
4.  Click "Save Quest".
5.  Verify UI switches back to Dashboard.
6.  Reload Plugin/Window (Simulate restart).
7.  Check if new story is persisted (via logs or if it appears in list if we implement list view, or just check `state.stories` via dev tools/logs).
