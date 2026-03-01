# Plan 068: Project Scanner & Management UI (Phase 2)

## Goal

Implement the **Project Scanner** and **Management UI** as defined in Phase 2 of `docs/ROADMAP.md`. Ideally, this will allow users to:

1.  See a list of "Template" quests (`📜`).
2.  Start a quest (compile it to `🧭`).
3.  See the currently "Active" quest (`🧭`).
4.  Pause/Resume quests.

## Requirements

- **Scanner Service**: Detect projects with `🏹` icon and categorize them.
- **Quest Manager**: Handle Start/Pause/Resume logic.
- **UI**: Display these lists and buttons in the Dashboard.

## Proposed Changes

### 1. `src/services/scanner.service.ts`

- Implement `ProjectScannerService` class.
- Methods: `scan(): Promise<QuestEnvironment>`.
- Logic: Check regex `📜`, `🧭`, `⏸️`.

### 2. `src/services/manager.service.ts`

- Implement `QuestManagerService` class.
- Methods: `startQuest(templateId)`, `pauseQuest(activeId)`, `resumeQuest(pausedId)`.
- Dependencies: `CompilerService`, `ScannerService`, `PluginAPI`.

### 3. `src/components/QuestDashboard.tsx` (New Component)

- A new dedicated component for the "Control Center".
- It will replace or augment the existing `DashboardView.tsx`.
- _Self-Correction_: `DashboardView.tsx` already exists. I should check if I should replace it or modify it.
  - `DashboardView.tsx` seems to be the main view. I will likely inspect it and modify/refactor it to include the new Quest Management section.

### 4. Integration

- The `ScannerService` will be called on `init()` and whenever a relevant action (Start/Pause) occurs.

## Verification Plan

### Automated Tests

- `src/services/scanner.service.test.ts`: Test regex categorization logic with mock projects.
- `src/services/manager.service.test.ts`: Test the orchestration of `CompilerService` and `PluginAPI` calls.

### Manual Verification

- **Start Quest**: Create a project "📜 Test Story" (manually or via mock if UI allows).
- **Verify**: It appears in the "Templates" list.
- **Action**: Click "Start".
- **Verify**: A new project "Test Story 🧭" is created (check via `PluginAPI.getAllProjects` logs or UI).
- **Action**: Click "Pause".
- **Verify**: Project renamed to "Test Story ⏸️".
