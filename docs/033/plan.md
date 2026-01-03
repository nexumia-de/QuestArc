# Plan: Completion Overlay Polish (033)

## Goal
Fix the story name display in the completion overlay and allow the user to close the overlay.

## Proposed Changes

### 1. Close Functionality (`src/types/messages.ts`, `src/handlers/MessageHandler.ts`, `src/app/App.tsx`)
- **`src/types/messages.ts`**: Add `ACKNOWLEDGE_COMPLETION` to `MESSAGE_TYPES`.
- **`src/handlers/MessageHandler.ts`**: Helper method to handle `ACKNOWLEDGE_COMPLETION`:
    - Set `state.activeStory.isCompleted = false`.
    - Save state.
- **`src/app/App.tsx`**: Add `handleAcknowledgeCompletion` function that sends the message and updates local state. Pass this handler to `DashboardView`.

### 2. UI Update (`src/components/DashboardView.tsx`)
- **Fix Story Name**:
    - Instead of `props.state.activeStory.id`, lookup the story in `props.state.stories` to get the real `.title`.
    - Fallback to ID if not found.
- **Add Close Button**:
    - Add a button inside `.quest-complete-content`.
    - `onClick` triggers the new `onAcknowledge` prop (which calls `handleAcknowledgeCompletion`).

## Verification Plan
1.  **Manual Test**:
    - Complete a quest.
    - Verify the overlay shows the correct **Title** (e.g., "Productivity Mastery") instead of ID.
    - Click "Close" (or "Continue").
    - Verify overlay disappears.
