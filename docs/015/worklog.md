# Worklog: Code Review & Refactoring

## Code Review Findings

- **Critical:** `processTaskCompletion` and `updateXp` were mutating the global state object directly. This creates side effects that are hard to track and violates functional programming principles.
- **Maintenance:** `MESSAGE_TYPES` was defined in both `messages.ts` and `plugin.ts`.
- **Types:** `any` was used for story saving payload.
- **Tooling:** `npm run lint` is broken (missing `eslint.config.js`).

## Changes Implemented

1.  **Immutability:**
    - Refactored `src/lib/game-logic.ts`: `processTaskCompletion` now deep clones modified sub-objects (Boss, Story) and returns a fresh state.
    - Refactored `src/lib/state-manager.ts`: `updateXp` now creates a shallow copy of state and deep copy of profile.
    - Updated `src/plugin.ts`: `taskComplete` hook and `SAVE_STORY` handler now strictly assign new state instead of mutating.

2.  **DRY & Types:**
    - Removed `const MESSAGE_TYPES = ...` from `plugin.ts`.
    - Imported `MESSAGE_TYPES` from `src/types/messages.ts`.
    - Updated `SaveStoryMessage` in `src/types/messages.ts` to use `HeroStory` type.

3.  **Verification:**
    - `npm run build`: Passed.
    - `npm run test`: Passed (Unit tests for damage calc).

## Outstanding Issues

- `eslint.config.js` is missing, causing `npm run lint` to fail. This requires a setup compatible with ESLint 9 + SolidJS + TypeScript.
