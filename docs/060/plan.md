# Story JSON Importer/Exporter

Allow users to export stories to JSON files and import them back. This facilitates sharing and backing up stories.

## User Review Required

    - **Import Behavior**: Should importing a story with an existing ID overwrite it or create a copy?
    - *Decision*: **Generate a new ID** ("Import as Copy").
    - **Import Methods**: File Upload AND Copy-Paste (Dialog).

## Proposed Changes

### Logic

#### [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)

- Update `handleImportStory` -> `importStoryFromData(json: any)`:
  - Removes UI logic (file picker).
  - Accepts parsed JSON object.
  - Validates and Saves.

### Components

#### [NEW] [ImportDialog.tsx](file:///home/deck/Projects/QuestArc/src/components/common/ImportDialog.tsx)

- Modal component.
- Props: `isOpen`, `onClose`, `onImport(json: any)`.
- UI:
  - Textarea for pasting JSON.
  - "Import from Text" button.
  - Divider.
  - "Upload JSON File" button (triggers hidden file input).

#### [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)

- Add state `importDialogOpen`.
- Render `ImportDialog`.
- "Import" button opens this dialog.

- Add `handleExportStory` function:
  - Takes `HeroStory` object.
  - Triggers browser download of JSON file.
  - **FALLBACK**: Wrapper for native file system is unreliable in this env. Will implement a `ExportDialog` that shows the JSON in a textarea for manual copy/paste if download fails (or as default if we just switch to it).
  - Current Plan: **Switch to Export Dialog** as primary method to ensure reliability.

### Components

#### [NEW] [ExportDialog.tsx](file:///home/deck/Projects/QuestArc/src/components/common/ExportDialog.tsx)

- Modal component.
- Props: `isOpen`, `onClose`, `story`.
- Body: Textarea with `JSON.stringify(story)`.
- Actions: "Copy to Clipboard", "Download as File" (try blob again as secondary option), "Close".

### Components

#### [StoryListView.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryListView.tsx)

- Add `Import Quest` button to the button row.
- Pass `onExport` prop to `ActiveQuestsList` and `CompletedQuestsList` and `StoryCard`.

#### [StoryCard.tsx](file:///home/deck/Projects/QuestArc/src/components/StoryCard.tsx)

- Add `onExport` prop.
- Add Export button (💾 icon).

### Data

- No schema changes.

## Verification Plan

### Automated Tests

- N/A (UI heavy functionality).

### Manual Verification

1.  **Export**:
    - Create a new story.
    - Click "Export" icon.
    - Verify `story_[title].json` is downloaded.
    - Verify JSON content matches story data.
2.  **Import**:
    - Click "Import Quest" button.
    - Select the downloaded file.
    - Verify a new story appears in the list with the same title/steps.
    - Verify it has a DIFFERENT ID (if we implement ID regeneration) or handles ID correctly.
3.  **Validation**:
    - Try to import a random JSON file.
    - Verify error handling (alert or console error).
