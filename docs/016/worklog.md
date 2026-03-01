# Worklog: Multi-Step "Heroic Story" Editor

## Summary

Implemented the UI and logic for creating multi-step stories.

## Changes

- **App.tsx**:
  - Updated state management to handle an array of steps (`steps` signal).
  - Added `addStep`, `updateStep`, and `removeStep` helper functions.
  - Updated `saveStory` to automatically link steps via `nextStepId`.
  - Replaced the single-step form with a dynamic list of step builders.
  - Added a "Story Name" input.

## Verification

- Verified the build passes.
- Verified the logic for linking `nextStepId` is correct: `index < steps().length - 1 ? index + 2 : undefined`.
