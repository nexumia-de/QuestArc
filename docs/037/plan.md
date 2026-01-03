# Plan: Restart Quest Popup

## Goal
Add a confirmation popup when a user clicks on a story that is already running. The user can choose to restart the quest or cancel.

## User Review Required
- None

## Proposed Changes

### UI Components
- **`src/components/StoryListView.tsx`**:
    - Update `handleCardClick` to check if `storyId === props.activeStoryId`.
    - If it is, show a confirmation modal using a new state `showRestartConfirm`.
    - Modal Text: "This quest is already running, do you want to restart?"
    - Buttons: "Yes" (Restart), "No" (Go to Dashboard).
    - "Yes" action: Call `confirmStart` (which calls `props.onStart`).
    - "No" action: Call `props.onNavigate('dashboard')`.

### Plugin Logic (`src/plugin.ts` / `src/handlers/MessageHandler.ts`)
- No changes needed. `START_QUEST` already resets the story progress to step 1.


## Verification Plan

### Automated Tests
- None available for UI interactions.

### Manual Verification
1.  Open the Story List.
2.  Click on a story that is NOT currently running. Verify it starts.
3.  Go back to Story List.
4.  Click on the SAME story again.
5.  Verify a popup appears: "This quest is already running, do you want to restart?".
6.  Click "No". Verify it navigates to the Dashboard (or stays, based on exact req "jump back to main dashboard").
7.  Click "Yes". Verify the quest restarts (progress reset to step 1).
