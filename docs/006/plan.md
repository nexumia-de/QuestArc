# Plan - Migrate Stories to Sync State (ID: 006)

## Goal

Move the story steps from a hardcoded/static constant into the persistent plugin state (`QuestArcState`). This allows for future user-customizable stories and ensures that the story progress is fully contained within the synced state.

## Analysis

- Currently, `plugin.ts` imports `productivity-mastery.json` and uses it as `STORY_DATA`.
- `QuestArcState` only tracks `currentStepId` and `streakProgress`.
- To make stories dynamic or modifiable, the stories should be stored in the state.
- **Refinement:** Instead of just adding steps to `activeStory`, we should add a top-level `stories` array to the state. `activeStory` should then just reference the active story ID. This supports multiple stories in the future.

## Proposed Changes

### 1. Types (`src/types/state.ts`)

- Add `stories: HeroStory[]` to `QuestArcState`.
- Simplify `activeStory` to only contain `id`, `currentStepId`, and `streakProgress`. Remove `title` and `steps`.

### 2. State Management (`src/lib/state-manager.ts`)

- Update `INITIAL_STATE` to populate `stories` with the default story data.
- Update `ensureState` to populate `stories` if missing and ensure `activeStory` has the correct structure.

### 3. Plugin Logic (`src/plugin.ts`)

- Update `getCurrentStep()` to look up the story in `state.stories` using `state.activeStory.id`.

### 4. UI (`src/app/App.tsx`)

- Update the UI to derive the current step title from the new state structure.

### 5. Build System

- Restore missing local packages (`packages/vite-plugin`) required for the build.
- Migrate `@super-productivity/plugin-api` to the npm registry version (`^1.0.1`).

### 6. Code Quality Improvements

- Create shared utility functions to eliminate code duplication.
- Ensure proper state migration by cleaning up deprecated fields.
- Simplify UI code by extracting complex inline logic into reusable functions.

## Verification Plan

- [x] Run `npm run typecheck` to ensure no regressions.
- [x] Run `npm run build` to verify the build process.
- [x] Verify that the UI correctly displays the step title from the state.
- [x] Ensure no code duplication between plugin.ts and App.tsx.
