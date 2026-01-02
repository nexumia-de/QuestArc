# Worklog - Migrate Stories to Sync State (ID: 006)

## Changes Made

### src/types/state.ts
- Modified `activeStory` in `QuestArcState` to include `title: string` and `steps: StoryStep[]`.

### src/lib/state-manager.ts
- Updated `INITIAL_STATE` to import and use the default story data from `productivity-mastery.json`.
- Updated `ensureState` to automatically add `steps` and `title` to `activeStory` if they are missing, ensuring backward compatibility for existing users.

### src/plugin.ts
- Removed static `STORY_DATA` constant and its import from `productivity-mastery.json`.
- Refactored `getCurrentStep()` to pull story steps directly from the runtime `state`.
- Cleaned up unused imports and constants.

## Verification Results
- `npm run typecheck` passed successfully.
- `npm run build` completed without errors.
- Verified that `plugin.ts` no longer relies on the external JSON constant after initialization, as the data is now fully integrated into the `state` object.
