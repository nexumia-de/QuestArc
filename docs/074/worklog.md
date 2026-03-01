# Worklog: Remove Quest Board

## Changes

- Deleted `StoryListView.tsx`, `StoryListView.css`, and `StoryCard.tsx`.
- Removed "Quest Board" button from `NavBar.tsx`.
- Removed `story-list` route from `ViewRouter.tsx`.
- Cleaned up `useNavigation.ts` and `App.tsx` removing `goToStoryList` and `story-list` type.
- Updated `deleteStory` callback to redirect to `dashboard`.

## Verification

- Ran `npm run build`. Build successful.
