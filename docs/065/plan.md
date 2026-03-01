# Plan: Dynamic Story Loading

## ID: 065

## Goal

Replace hardcoded story imports in `src/lib/state/persistence.ts` with dynamic loading from `src/assets/stories/*.json`. This allows adding new stories by simply dropping JSON files into the directory.

## User Review Required

> [!IMPORTANT]
> This change removes the hard dependency on `productivity-mastery.json`. If no JSON files exist in `src/assets/stories/`, the app may initialize with no active story.

## Proposed Changes

### `src/lib/state`

#### [MODIFY] [persistence.ts](file:///home/deck/Projects/QuestArc/src/lib/state/persistence.ts)

- Remove `import storyDataRaw ...`
- Add `const storyFiles = import.meta.glob('../../assets/stories/*.json', { eager: true });`
- Parse and aggregate all stories into a `DEFAULT_STORIES` array.
- Update `ensureState` to:
  - Populate `newState.stories` from `DEFAULT_STORIES`.
  - Set `activeStory` using the first available story if none is active.

## Verification Plan

### Automated Tests

- Run `npm run build` to ensure the rollup error is resolved.

### Manual Verification

- Check if the app loads without crashing.
- Verify that if a JSON file is present in `src/assets/stories`, it is loaded into the state.
