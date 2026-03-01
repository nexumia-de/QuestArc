# Worklog: Story History

## Changes Implemented

1.  **State Management**:
    - Added `completedStories` field to `QuestArcState` in `src/types/state.ts`.
    - Updated `INITIAL_STATE` in `src/lib/state/config.ts` to include empty `completedStories` array.
    - Updated `ensureState` in `src/lib/state/persistence.ts` to initialize `completedStories` if missing.

2.  **Logic**:
    - Modified `MessageHandler.ts` to handle `ACKNOWLEDGE_COMPLETION` by archiving the completed story to `state.completedStories` before clearing the active story.
    - **Update**: Logic enhanced to also remove the completed story from `state.stories`, ensuring it disappears from the main list.
    - **Restart**: Added logic to `START_QUEST` to restore a story from `state.completedStories` if it's not in the active list.

3.  **UI**:
    - Updated `StoryListView.tsx` to accept and display `completedStories`.
    - Added a "History" section to `StoryListView` to show completed quests with their completion date.
    - Added a "**Restart**" button to completed quest cards to allow re-playing them.
    - **Update**: Refined Restart interaction: Removed dedicated button, added click handler to card to show restart popup.
    - **Update**: Removed "Edit" button from completed story cards (History items).
    - **Refinement**: Made "My Quests" (active stories) collapsible and collapsed by default. Made "History" section always visible.(Adjusted: Active always visible, History Collapsible).
    - **Logic Update**: Completed stories are no longer removed from the "My Quests" list. They remain visible but are greyed out to indicate completion.
    - **Refinement**: Made "My Quests" (active stories) collapsible and collapsed by default. Made "History" section always visible.(Adjusted: Active always visible, History Collapsible).
    - **Logic Update**: Completed stories are no longer removed from the "My Quests" list. They remain visible but are greyed out to indicate completion.
    - **UI Update**: Separated active and completed stories in "My Quests". Created a collapsible "Completed Quests" section (hidden by default) with an arrow toggle.
    - **Logic Update**: "History" serves as a log of all completions, while "My Quests" serves as the library of available quests.
    - Updated `App.tsx` to pass `completedStories` to `StoryListView`.

## Verification

- Ran `npm run build` to verify type safety and build process (Passed).
- Manual verification required to test the full flow:
  1.  Start a quest.
  2.  Complete it.
  3.  Verify it moves to the "History" section.
