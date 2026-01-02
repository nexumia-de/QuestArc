# Plan: Refactor StoryCard Component

## Goal Description
Refactor the inline story card in `App.tsx` into a reusable `StoryCard` component to improve code maintainability and cleanliness.

## Proposed Changes

### Components
#### [NEW] [StoryCard.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryCard.tsx)
- Extract story card UI from `App.tsx`.
- Accept props for title, steps count, xp, active state, and edit action.

### Main App
#### [MODIFY] [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)
- Replace inline mapping of stories with `StoryCard` component.

## Verification Plan
### Automated Tests
- Run `npm run build` to ensure type safety and successful compilation.

### Manual Verification
- Verify the story list renders identically to before.
- Check edit button functionality.
