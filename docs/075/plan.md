# Plan: Remove Duplicate Quest Dashboard

## Goal
The `DashboardView` currently renders `QuestDashboard` in two places:
1. As a fallback when no story is active.
2. Always at the bottom of the view.

The user requested to remove the duplicate and keep the second one (the one at the bottom).

## Proposed Changes

### [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx)
- Remove the `fallback` prop from the main `Show` component that checks `props.state.activeStory.id`.

## Verification
- Run `npm run build` to ensure no syntax errors.
- Verify conceptual logic: When no story is active, the top part renders nothing, and the bottom `QuestDashboard` remains visible. When a story IS active, the top part renders the story, and the bottom `QuestDashboard` remains visible. This meets the requirement.
