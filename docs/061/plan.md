# Story Delete Functionality

The goal is to allow users to delete a story while in edit mode. This requires a new message type, handler logic to remove the story from state, and UI updates in the `EditorView` to add a delete button with confirmation.

## User Review Required

> [!WARNING]
> Deleting a story is permanent and cannot be undone. A confirmation dialog will be added to prevent accidental deletions.

## Proposed Changes

### Core Logic (Brain)

#### [messages.ts](file:///home/deck/Projects/QuestArc/src/types/messages.ts)
- Add `DELETE_STORY` to `MESSAGE_TYPES` enum.
- Define `DeleteStoryMessage` interface with `payload: { storyId: string }`.

#### [MessageHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/MessageHandler.ts)
- Add case for `MESSAGE_TYPES.DELETE_STORY`.
- Logic:
    - Remove story from `state.stories`.
    - If it's in `state.completedStories`, remove it from there too? (Probably yes, to fully delete it).
    - If the deleted story is the *active* story, reset `activeStory` to null/initial state.
    - Save state.

### Frontend (Face)

#### [useQuestArc.ts](file:///home/deck/Projects/QuestArc/src/hooks/useQuestArc.ts)
- Add `deleteStory(storyId: string, onSuccess?: () => void)` function.
- It sends `DELETE_STORY` message.
- Upon success, calls `onSuccess` callback.

#### [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)
- Pass `deleteStory` to `ViewRouter`.
- Implement `handleDeleteStoryWrapper` to handle navigation after deletion.

#### [ViewRouter.tsx](file:///home/deck/Projects/QuestArc/src/components/ViewRouter.tsx)
- Pass `deleteStory` prop to `EditorView`.

#### [EditorView.tsx](file:///home/deck/Projects/QuestArc/src/components/EditorView.tsx)
- Add "Delete Story" button (only if editing an existing story).
- Use `ConfirmDialog` (reuse existing if possible, or add new state for it) to confirm deletion.
- Call `onDelete` prop on confirmation.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure type safety.
- Run `npm run lint` (or `checkFile`) to ensure code quality.

### Manual Verification
1.  **Create a Story**: Create a new story.
2.  **Edit Story**: Go to "Quest Board", click edit on the new story.
3.  **Delete Story**: Click "Delete Story".
4.  **Confirm**: Verify confirmation dialog appears. Confirm deletion.
5.  **Verify Removal**: Ensure story is gone from "Quest Board".
6.  **Active Story Deletion**: Start a story, then go to edit it (is that possible? usually you edit from list). If possible, delete it and ensure dashboard handles "no active story" gracefully.
    - *Note*: `StoryListView` allows editing active stories. If deleted, the dashboard should probably be cleared or reset.

