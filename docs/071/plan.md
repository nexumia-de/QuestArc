# Fix Story Icon Copying

## Goal Description

Ensure that when a story is created (from a project template), the project's icon is correctly copied to the story's metadata.

## Proposed Changes

### Logic Layer

#### [MODIFY] [compiler.service.ts](file:///home/deck/Projects/QuestArc/src/services/compiler.service.ts)

- Retrieve `icon` from the template project.
- Pass `icon` to `PluginAPI.addProject` when creating the new active quest.

#### [MODIFY] [scanner.service.ts](file:///home/deck/Projects/QuestArc/src/services/scanner.service.ts)

- Update `QuestProject` interface to include `icon`.
- Populate `icon` in `ProjectScannerService.scan`.

### UI Layer (Optional but recommended)

#### [MODIFY] [QuestDashboard.tsx](file:///home/deck/Projects/QuestArc/src/components/QuestDashboard.tsx)

- Display the icon in the Active Quest card and Template list.

## Verification Plan

### Manual Verification

- Create a new story from a template project with an icon.
- Verify that the created story displays the correct icon in the UI.
