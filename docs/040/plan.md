# Story History

## Goal Description
Implement a history tracking feature for completed stories. When a user completes a quest, it should be moved to a "History" list instead of just disappearing or being reset. This allows users to review their achievements.

## User Review Required
> [!IMPORTANT]
> This change introduces a new field `completedStories` to the state. Existing state will be migrated automatically (implicitly handled by TypeScript optional checks, but explicit migration might be safer if we want strict typing). For now, we'll verify if `completedStories` exists.

## Proposed Changes

### State Management
#### [MODIFY] [QuestArcState.ts](file:///home/deck/Projects/QuestArc/src/types/state.ts)
- Add `completedStories: CompletedStory[]` to `QuestArcState`.
- Define `CompletedStory` interface extending `HeroStory` with `completedAt: number`.

### Logic
#### [MODIFY] [MessageHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/MessageHandler.ts)
- Update `ACKNOWLEDGE_COMPLETION` case.
- Before clearing `activeStory`, find the full story object.
- Add it to `state.completedStories` with the current timestamp.
   - **Refinement**: Remove the story from `state.stories` so it no longer appears in the "Available" list.

### UI
#### [MODIFY] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)
- Add a new section "Completed Quests" below the active/available stories.
- Render completed stories (maybe with a slightly different visual style or a "Completed on [Date]" badge).
- Update types to accept `completedStories` prop.

#### [MODIFY] [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)
- Pass `completedStories` from state to `StoryListView`.

### Restart Functionality
#### [MODIFY] [MessageHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/MessageHandler.ts)
- Update `START_QUEST` to check `completedStories` if story not found in `state.stories`.
- If found in history:
    - Add it back to `state.stories`.
    - Proceed with start logic.

#### [MODIFY] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)
- Remove "Restart" button.
- Make completed story cards clickable.
- Add `showHistoryRestartConfirm` state.
- Implement popup: "Restart this quest? It will be moved to active quests."
- Wire click to show this popup.
- **Update**: Remove `onEdit` from history items. Pass optional `onEdit` to `StoryCard`.
- **Correction**: Active Quests list always visible. History list collapsible (default hidden).
- **Core Logic Change**: Do NOT remove completed stories from the active `stories` list.
- **UI Update**: In "My Quests", separate incomplete and completed stories.
- **UI Update**: Render "Completed Quests" as a collapsible section (hidden by default) below the active ones.
- **UI Update**: Completed stories have `opacity: 0.6`.

#### [MODIFY] [MessageHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/MessageHandler.ts)
- In `ACKNOWLEDGE_COMPLETION`, remove the logic that filters the completed story out of `state.stories`. Keeps the definition available.

#### [MODIFY] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)
- Add `isCompletedExpanded` state (default false).
- Split stories into `active` and `completed`.
- Render `active`.
- Render collapsible header for `completed` if any exist.
- Render `completed` inside conditional Show.

#### [MODIFY] [StoryCard.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryCard.tsx)
- Make `onEdit` prop optional.
- Only render edit button if `onEdit` is present.

## Verification Plan

### Manual Verification
1.  **Start a Quest**: Select a quest from the dashboard.
2.  **Complete the Quest**: Go through all steps and complete them. Defeat the boss.
3.  **Click "Complete Quest"**: Trigger the completion action.
4.  **Check "My Quests"**: Navigate to the "My Quests" page.
5.  **Verify History**: Ensure the completed quest appears in the "Completed Quests" section.
6.  **Persistence**: Reload the page and verify the history remains.
