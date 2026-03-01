# Plan: Component Refactoring (App.tsx)

## Goal Description

Refactor the monolithic `App.tsx` into smaller, focused components to improve maintainability and readability.

## Proposed Changes

### Components

#### [NEW] [Header.tsx](file:///home/deck/Projects/QuestArc/src/components/Header.tsx)

- Extract the user profile header (Avatar, HP, XP).

#### [NEW] [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx)

- Extract the "Current Story Step" and "Boss Battle" sections.

#### [NEW] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)

- Extract the "My Quests" list section.

#### [NEW] [EditorView.tsx](file:///home/deck/Projects/QuestArc/src/components/EditorView.tsx)

- Extract the "Story Editor" form.

### Main App

#### [MODIFY] [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)

- Remove inline rendering of views.
- Import and use the new components.
- Keep the state management and routing logic.

## Verification Plan

### Automated Tests

- Run `npm run build` to ensure type safety.

### Manual Verification

1. **Dashboard**: Verify the current step and boss header display correctly.
2. **Story List**: specific check that all stories are listed and the "Edit" button works.
3. **Editor**: Create a new story and verify it saves. Edit an existing story and verify updates.
4. **Navigation**: Switch between all three views and ensure smooth transitions.
