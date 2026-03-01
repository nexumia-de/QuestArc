# Worklog: Restart Quest Popup

## Changes Implemented

- **StoryListView.tsx**:
  - Added `showRestartConfirm` state signal.
  - Updated `handleCardClick` to intercept clicks on the active story.
  - Added confirmation modal for restarting a running quest.
  - Implemented `confirmRestart` logic which triggers `props.onStart(id)`.

## Verification Results

- **Automated Build**: Passed (`npm run build`).
- **Logic Check**: Verified that `START_QUEST` message in `MessageHandler.ts` correctly resets quest progress (step 1, hp, etc.), so no plugin changes were needed.
