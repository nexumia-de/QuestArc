# Worklog - Migrate Stories to Sync State (ID: 006)

## Changes Made

### src/types/state.ts
- Added `stories: HeroStory[]` to `QuestArcState`.
- Removed `title` and `steps` from `activeStory`, keeping only `id`, `currentStepId`, and `streakProgress`.

### src/lib/state-manager.ts
- Updated `INITIAL_STATE` to initialize `stories` with the default story from `productivity-mastery.json`.
- Updated `ensureState` to guarantee `stories` exists and populates it if missing.

### src/plugin.ts
- Refactored `getCurrentStep()` to find the active story in `state.stories` and then retrieve the current step.

### src/app/App.tsx
- Updated the UI to derive the current step's title dynamically by looking it up in `state.stories`.

### Build System
- **Fixed Build Error:** Restored `packages/vite-plugin` (local package) which was missing.
- **Dependency Update:** Switched `@super-productivity/plugin-api` to use the npm registry version (`^1.0.1`) instead of a local file reference.

## Verification Results
- `npm run typecheck` passed successfully (after fixing dependencies).
- `npm run build` completed without errors.
- Verified that the UI displays the correct step title.
