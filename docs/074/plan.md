# Plan: Remove Quest Board

## Goal

Remove the legacy "Quest Board" (`StoryListView`) and related elements to streamline the UI, as the `QuestDashboard` now handles quest management.

## Proposed Changes

### Components

- [DELETE] `src/components/StoryListView.tsx`
- [DELETE] `src/components/StoryListView.css`
- [DELETE] `src/components/StoryCard.tsx`

### Navigation & Routing

- Update `NavBar.tsx` to remove the Quest Board link.
- Update `ViewRouter.tsx` to remove the `story-list` route.
- Update `useNavigation.ts` and `App.tsx` types and logic to remove references to `story-list`.

## Verification

- Run `npm run build` to ensure no broken references.
- Verify UI (conceptual check) that Quest Board button is gone and redirects (like delete) go to dashboard.
