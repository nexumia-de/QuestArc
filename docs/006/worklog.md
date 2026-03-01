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

### Code Quality Improvements

#### src/lib/state-manager.ts

- **Added Shared Utility Functions:**
  - `getActiveStory(state)` - Retrieves the active story definition from state
  - `getCurrentStep(state)` - Retrieves the current step from the active story
  - `getCurrentStepTitle(state)` - Gets the current step title with fallback to story ID
- **Improved State Migration:**
  - Added explicit cleanup of deprecated `title` and `steps` fields from `activeStory` object
  - Ensures clean migration from old state structure to new structure
- **Added Import:** Imported `StoryStep` type to support new utility functions

#### src/app/App.tsx

- **Simplified UI Code:**
  - Replaced complex 6-line IIFE (Immediately Invoked Function Expression) with single function call
  - Changed from: `(() => { const activeStory = ...; const currentStep = ...; return ... })()`
  - Changed to: `getCurrentStepTitle(s())`
- **Added Import:** Imported `getCurrentStepTitle` from `state-manager`
- **Result:** Cleaner, more readable JSX template

#### src/plugin.ts

- **Eliminated Code Duplication:**
  - Removed local `getCurrentStep()` function implementation
  - Now imports and uses shared `getCurrentStep()` utility from `state-manager`
  - Updated function call to pass `state` parameter: `getCurrentStep(state)`
- **Added Import:** Added `getCurrentStep` to imports from `state-manager`

## Verification Results

- `npm run typecheck` passed successfully (after fixing dependencies).
- `npm run build` completed without errors.
- Verified that the UI displays the correct step title.
- Confirmed no code duplication between `plugin.ts` and `App.tsx`.
- All shared utilities follow DRY (Don't Repeat Yourself) principles.
