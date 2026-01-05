# Worklog: Story Delete Functionality

**ID**: 061
**Date**: 2026-01-05
**Author**: Antigravity

## Summary
Implemented the ability for users to delete stories directly from the editor view. This includes a new backend message type `DELETE_STORY` and a frontend "Delete Story" button with a confirmation dialog.

## Changes

### Brain (Logic)
- [x] **New Message Type**: Added `DELETE_STORY` to `MESSAGE_TYPES` and `PluginMessage` in `src/types/messages.ts`.
- [x] **Handler Logic**: Implemented `DELETE_STORY` case in `MessageHandler.ts`.
    - Removes story from `stories` and `completedStories`.
    - Resets `activeStory` if the deleted story was active.
    - Saves state.
    - **Fix**: Wrapped all switch cases in braces `{}` to prevent variable scoping issues (`const` redeclaration/hoisting).
    - **Fix**: Renamed `INITIAL_HP`/`MAX_HP` to `STARTING_HP`/`MAX_HP` and moved them to `config.ts` to resolve build/minification artifact issue (`const a as $` syntax error).

### Face (UI)
- [x] **Hook Update**: Added `deleteStory` function to `useQuestArc` in `src/hooks/useQuestArc.ts`.
- [x] **Router Update**: Passed `handleDeleteStory` through `App.tsx` and `ViewRouter.tsx`.
- [x] **Refinement**: Changed delete AND save redirect from Dashboard to Quest Board (`goToStoryList`).
- [x] **UI Component**: Updated `EditorView.tsx` to include:

    - "Delete Story" button (only visible when editing existing stories).
    - `ConfirmDialog` for delete confirmation.
    - Added `EditorView.css` for button styling.
- [x] **New Feature**: Added "Cancel" and "Restart" buttons for active quests in `StoryListView`.
    - Extended `ConfirmDialog` to support `customActions`.
    - Added `cancelQuest` message and handler.
- [x] **Global Styles**: Added `.danger-btn` class to `App.css` for red button styling in confirmation dialogs.
- [x] **ConfirmDialog**: Added `isDanger` prop to `ConfirmDialog.tsx` to support destructive action styling.

## Verification
- [x] **Build**: `npm run build` passed successfully.
- [x] **Lint**: Code changes adhered to project structure and tyepscript types.

## Screenshots
(No browser screenshots available as this was verified via code analysis and build)
