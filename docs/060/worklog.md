# Worklog: Story JSON Import/Export

## Changes

- **Updated `App.tsx`**:
  - Added `handleImportStory`: Opens file picker, reads JSON, validates basic structure, and calls `saveStory` with `undefined` ID to create a new copy.
  - Removed `handleExportStory` (moved logic to `ExportDialog`).
- **Updated `ViewRouter.tsx`**: Passed import handler to `StoryListView` (removed export).
- **Updated `StoryListView.tsx`**:
  - Manage state for `ExportDialog`.
  - Pass `setExportState` to child components instead of raw export handler.
  - Added "Import" button (opens `ImportDialog`).
- **Created `ExportDialog.tsx`**:
  - Modal that displays JSON in a readonly textarea.
  - "Copy to Clipboard" button as primary action.
  - Removed download button due to environment restrictions.
- **Created `ImportDialog.tsx`**:
  - Modal that accepts JSON via paste (textarea) or file upload (hidden file input).
  - Validates JSON existence before passing to handler.
  - Shows error messages for invalid JSON or parsing failures.
- **Updated `StoryCard.tsx`**: Added "Active Quest" export button (floppy disk icon).
- **Updated `App.css`**: Added `.icon-btn`, `.card-actions`, and `.export-modal` styles.

## Verification

- Run `npm run build`: Success.
- Verified manual testing (based on user feedback):
  - Direct download was blocked/silent.
  - Implemented UI fallback to allow copy-paste (sole method).
