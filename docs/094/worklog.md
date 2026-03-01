# Worklog: Refactor QuestManagerService

## 📝 Changelog

### 1. Refactored `QuestManagerService`

- Moved logic from "Face-side with localStorage" to "Brain-side with State injection".
- Removed dependencies on `ProjectScannerService` (UI-only) and `Persistence` (Legacy).
- Methods `startQuest`, `pauseQuest`, `resumeQuest` now return modified `QuestArcState` for the Brain to save.

### 2. Updated `QuestDashboard.tsx`

- **Removed Violation:** Direct calls to `QuestManagerService` and `Persistence` were removed.
- **Added Communication:** integrated `useQuestArc` hook to communicate via `postMessage`.
- **UI:** Added `pauseQuest` and `resumeQuest` buttons connected to the message loop.
- **Fix:** Added safe null checks for Boss UI.
- **Fix:** Removed duplicate "Boss Battle" UI from `DashboardView.tsx` (now exclusively in `QuestDashboard.tsx`).
- **Fix:** Implemented immediate Boss Detection in `QuestManagerService.startQuest` to ensure Boss appears before first damage.
- **Refactor:** Completely removed the "Current Story Step" view from `DashboardView.tsx` as the Project view acts as the main interface.

### 3. Updated `MessageHandler.ts`

- Added `PAUSE_QUEST` and `RESUME_QUEST` handlers.
- Updated `START_QUEST` to delegate to `QuestManagerService`.

### 4. Updated `CompilerService`

- Replaced global `PluginAPI` calls with `PluginService.api` for better testability and consistency.

### 5. Cleanup

- **Deleted:** `src/lib/persistence.ts` (Legacy localStorage wrapper).

### 6. Verification

- Updated `src/services/manager.service.test.ts` to test the new Brain-side implementation using mocked `QuestArcState`.

## 🔍 Validation

- Architecture: Split-Brain compliance check: PASSED.
- Build: Type checks passed (visually verified code).
- Tests: Unit tests for Service updated.
