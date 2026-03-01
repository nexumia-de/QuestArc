# Fix Initial Active Story

## Goal Description

Fix the issue where the game initializes with an active story by default. The user should start with no active story.

## Proposed Changes

### Configuration

#### [MODIFY] [config.ts](file:///home/deck/Projects/QuestArc/src/lib/state/config.ts)

- Update `INITIAL_STATE.activeStory.id` to `null`.

## Verification Plan

### Automated Tests

- `npm run build`: Ensure strict type compliance.

### Manual Verification

1.  **Fresh Start**: Clear local storage or simulate a fresh install.
2.  **Dashboard**: Verify that the dashboard shows the "No Active Quest" state (or equivalent) instead of a running story.
