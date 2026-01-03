# Worklog: Allow No Active Story (034)

## Summary
Enabled the ability for users to have no active quest running. Users can now stop a quest from the dashboard, which clears the active story state. The Dashboard UI was updated to handle the "Empty State" by prompting the user to start or create a new quest.

## Changes
- **State Schema**: Updated `QuestArcState.activeStory` to be nullable (`... | null`).
- **Persistence**: Modified `ensureState` to stop enforcing a default story creation if none exists.
- **Message Handling**: Added `STOP_QUEST` message type and handler in `MessageHandler.ts`.
- **UI**:
    - Updated `DashboardView.tsx` to show a "No Active Quest" screen when `activeStory` is null.
    - Added a "Stop Quest" button to the active quest view.
    - Updated `App.tsx` implementing `handleStopQuest` and fixing state type compatibility.
    - Updated `StoryListView.tsx` to handle nullable `activeStoryId` prop.

## Verification
- **Build**: `npm run build` passed successfully.
- **Logic Check**: Verified that `STOP_QUEST` clears the state and `DashboardView` renders the empty state correctly based on props.
