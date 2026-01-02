# Plan - Migrate Stories to Sync State (ID: 006)

## Goal
Move the story steps from a hardcoded/static constant into the persistent plugin state (`QuestArcState`). This allows for future user-customizable stories and ensures that the story progress is fully contained within the synced state.

## Analysis
- Currently, `plugin.ts` imports `productivity-mastery.json` and uses it as `STORY_DATA`.
- `QuestArcState` only tracks `currentStepId` and `streakProgress`.
- To make stories dynamic or modifiable, the full `StoryStep[]` array should be part of the state.
- Persistence is already handled in `plugin.ts` via `saveState()`.

## Proposed Changes

### 1. Types (`src/types/state.ts`)
- Update `QuestArcState.activeStory` to include `steps: StoryStep[]` and `title: string`.

### 2. State Management (`src/lib/state-manager.ts`)
- Update `INITIAL_STATE` to include the default story steps from the JSON file.
- Update `ensureState` to populate `steps` if they are missing in existing saved states (migration/compatibility).

### 3. Plugin Logic (`src/plugin.ts`)
- Remove static `STORY_DATA` import.
- Update `getCurrentStep()` to read from `state.activeStory.steps`.
- Ensure `init()` properly migrates/ensures the state structure.

## Verification Plan
- [ ] Run `npm run typecheck` to ensure no regressions.
- [ ] Run `npm run build` to verify the build process.
- [ ] (Manual) Verify that state now contains the full story data after a save.
