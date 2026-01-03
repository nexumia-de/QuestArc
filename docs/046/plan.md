# Navigation & Dashboard Renaming

Renaming "Quests" to "Adventure", "My Quests" to "Quest Board", and cleaning up the Dashboard UI.

## User Review Required

> [!IMPORTANT]
> **Dashboard Buttons Removal**: The plan removes the "New Quest" button from the Dashboard (Active Story view). Users will now create quests via the "Quest Board" (formerly "My Quests") view. The "My Quests" button on the Dashboard will be replaced/renamed to "Quest Board".

## Proposed Changes

### Component: Navigation
#### [MODIFY] [NavBar.tsx](file:///home/deck/Projects/QuestArc/src/components/NavBar.tsx)
- Rename "Quests" button to "Adventure" (navigates to `dashboard`).
- Add new "Quest Board" button (navigates to `story-list`).
- Update active state logic: "Adventure" is active only for `dashboard`, "Quest Board" is active for `story-list`.

### Component: Story List (Quest Board)
#### [MODIFY] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)
- Rename Header: "My Quests" -> "Quest Board".
- Remove "Back to Dashboard" button (since footer handles navigation).

### Component: Dashboard (Adventure Board)
#### [MODIFY] [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx)
- **Active State**:
    - Remove bottom action buttons ("My Quests", "New Quest").
- **Empty State**:
    - Remove "My Quests" button.
    - Remove "New Quest" button (user is directed to Quest Board via footer to manage/start quests).

## Verification Plan

### Manual Verification
1.  **Footer Check**:
    -   Verify "Adventure" tab exists.
    -   Verify "Quest Board" tab exists.
    -   Verify clicking works and updates active state correctly.
2.  **Dashboard Check**:
    -   Verify no bottom buttons in active state.
    -   Verify empty state is clean (maybe just text guiding to Quest Board).
3.  **Quest Board Check**:
    -   Verify header is "Quest Board".
    -   Verify no "Back to Dashboard" button.
