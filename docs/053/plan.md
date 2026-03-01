# 053 - Refactor Major Inconsistencies

## Goal

Fix critical inconsistencies in the codebase to improve maintainability, verifyability, and user experience. This includes standardizing component declarations, deduplicating modal logic, unifying error handling, and cleaning up CSS organization.

## User Review Required

> [!IMPORTANT]
> This is a refactoring task. Functionality should remain unchanged, but the code structure will potentially look different.

## Proposed Changes

### Component Standardization

#### [MODIFY] [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)

- Change `function App()` to `const App: Component = () => ...` to match other components.

### Modal Logic Deduplication

#### [NEW] [ConfirmDialog.tsx](file:///home/deck/Projects/QuestArc/src/components/common/ConfirmDialog.tsx)

- Create a reusable `ConfirmDialog` component.
- Props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`.

#### [MODIFY] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)

- Replace the 3 separate modals with the new `ConfirmDialog`.

### Error Handling Consistency

#### [MODIFY] [TaskService.ts](file:///home/deck/Projects/QuestArc/src/services/TaskService.ts)

- Add try/catch blocks to `updateTaskTitle`.
- Ensure consistent error logging.

#### [MODIFY] [CharacterView.tsx](file:///home/deck/Projects/QuestArc/src/components/CharacterView.tsx)

- Add try/catch handling to `handleSaveAvatar`.
- Add error logging.

### CSS Organization

#### [NEW] [StoryListView.css](file:///home/deck/Projects/QuestArc/src/components/StoryListView.css)

- Extract inline styles from `StoryListView.tsx` into this file.

#### [MODIFY] [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)

- Import `StoryListView.css`.
- Remove inline styles and use classes.

#### [MODIFY] [App.css](file:///home/deck/Projects/QuestArc/src/app/App.css)

- Review and move any `StoryListView` specific styles if they exist here (optional cleanup).

## Verification Plan

### Automated Tests

- Run `npm run build` to ensure no syntax errors.
- Run `npm run checkFile` on modified files.

### Manual Verification

1. **Story List**:
   - Click on a new story -> Verify "Start Quest" dialog appears and works.
   - Click on an active story -> Verify "Quest Running" dialog appears and works.
   - Click on a completed story -> Verify "Restart Quest" dialog appears and works.
   - Verify list formatting looks correct (no regression from CSS extraction).
2. **Character View**:
   - Change avatar -> Verify it saves (check logs for success).
   - Simulate network failure (if possible) or ensure no crash.
3. **App**:
   - Verify app loads correctly (Component declaration change).
