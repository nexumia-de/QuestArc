# Further Improvements

## Goal Description

Address remaining code quality issues: move inline styles to CSS, optimize dialog state updates, and extract nested components for better performance.

## User Review Required

> [!NOTE]
> This is a pure refactor. No functionality changes are expected.

## Proposed Changes

### Inline Styles Fix

#### [MODIFY] [ViewRouter.tsx](file:///home/deck/Projects/QuestArc/src/components/ViewRouter.tsx)

- Move `padding-bottom: 80px` to `App.css` (or `ViewRouter.css` if created, but `App.css` is fine for layout).

#### [MODIFY] [Avatar.tsx](file:///home/deck/Projects/QuestArc/src/components/Avatar.tsx)

- Move `width: 100%, height: 100%` to a class in `App.css` (or existing `Avatar` related styles).

#### [MODIFY] [StepBuilder.tsx](file:///home/deck/Projects/QuestArc/src/components/editor/StepBuilder.tsx)

- Move `flex: 0 0 80px` to `EditorView.css` (assumed location for editor styles, or creates/uses `DashboardView.css` if editor styles are there).

#### [MODIFY] [CompletionRequirementEditor.tsx](file:///home/deck/Projects/QuestArc/src/components/editor/CompletionRequirementEditor.tsx)

- Extract layout styles (flex, gap, check input dimensions) to CSS classes.

### StoryListView Optimization

#### [MODIFY] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)

- Update `closeDialog` to: `setConfirmState({ isOpen: false, type: 'start', storyId: null });`
- Extract `ActiveQuestsList`, `CompletedQuestsList`, and `HistorySection` out of the main component render function.
- Move them to defined components within the same file or distinct files if simple enough. Given they use props from parent, might need to pass props or define as separate components accepting props.

## Verification Plan

### Automated Verification

- Run `npm run build`.

### Manual Verification

- **Inline Styles**: Check "Avatar", "ViewRouter" (padding at bottom of app), and "Editor" (step builder layout) to ensure no visual regression.
- **StoryListView**: Verify clicking around stories, confirming start/restart still works, and "History" expansion works.
