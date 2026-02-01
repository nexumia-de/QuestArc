# Plan: Refactor QuestManagerService (Fix Split-Brain Violation)

## Context
The `QuestManagerService` in `src/services/manager.service.ts` currently violates the Split-Brain architecture by:
1. Being imported/used directly by the UI (`QuestDashboard`).
2. Using `localStorage` (via `Persistence.ts`) directly, bypassing the Host API and Brain state management.

## Goals
1. **Remove Persistence Violation:** Ensure no logic in `src/components` reads/writes `localStorage`.
2. **Brain-Side Service:** Refactor `QuestManagerService` to be a pure Brain service (or Brain-compatible helper) that operates on `QuestArcState`.
3. **Message-Based Communication:** Update `QuestDashboard` to use messages (`START_QUEST`, `PAUSE_QUEST`, `RESUME_QUEST`) via `useQuestArc` hook instead of direct service calls.
4. **Cleanup:** Delete `src/lib/persistence.ts`.

## Proposed Changes

### Brain (`src/plugin.ts`, `src/handlers`)
- Update `QuestManagerService` to remove `ProjectScanner` dependency and `localStorage`. It should accept `state` and return `newState`.
- Update `MessageHandler.ts` to delegate `START_QUEST`, `PAUSE_QUEST`, `RESUME_QUEST` to `QuestManagerService`.
- Add `PAUSE_QUEST` and `RESUME_QUEST` handlers.

### Face (`src/components`, `src/hooks`)
- Update `src/types/messages.ts` with new message types.
- Update `useQuestArc.ts` to include `pauseQuest` and `resumeQuest` methods.
- Update `QuestDashboard.tsx`:
    - Remove `QuestManagerService` import.
    - Remove `Persistence` import.
    - Use `useQuestArc` for state and actions.
    - Ensure project list refresh after actions.
- Delete `src/lib/persistence.ts`.

### Logic
- `CompilerService.ts`: Replace global `PluginAPI` with `PluginService.api`.

## Verification
- `manager.service.test.ts` should be updated and pass.
- `QuestDashboard` should correctly start/pause/resume quests via messages.
- No direct `localStorage` calls should remain in `src/components` or `src/services` used by components.
