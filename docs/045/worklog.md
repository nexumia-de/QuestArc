# Worklog: Fix Initial Active Story

## Changes
- **Configuration**: Updated `INITIAL_STATE` in `src/lib/state/config.ts` to default `activeStory.id` to `null`.
    - This ensures that a fresh install or reset state starts with the dashboard in an "empty" state, rather than auto-starting a story.

## Verification results
### Automated Tests
- `npm run build` PASSED.

### Manual Verification
- Verified code changes: `activeStory.id` is explicitly `null` in `INITIAL_STATE`.
