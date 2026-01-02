# Plan: Code Review & Refactoring

## Context
The user requested a code review for best practices and maintainability.
An analysis of the codebase revealed several violations of the project's mandates:
1.  **Immutability:** `state-manager.ts` and `game-logic.ts` were mutating state objects directly.
2.  **DRY:** `MESSAGE_TYPES` was duplicated in `plugin.ts`.
3.  **Type Safety:** `SaveStoryMessage` used `any`.
4.  **Linting:** `npm run lint` fails due to missing config.

## Objectives
1.  Refactor `state-manager.ts` (`updateXp`) to be immutable.
2.  Refactor `game-logic.ts` (`processTaskCompletion`) to be immutable.
3.  Refactor `plugin.ts` to consume new immutable functions and update its own state handling (e.g., `taskComplete` hook, `SAVE_STORY`).
4.  Remove duplicate `MESSAGE_TYPES` in `plugin.ts`.
5.  Improve type definitions in `messages.ts`.

## Constraints
- Must maintain "Split-Brain" architecture.
- Must pass `npm run build`.

## Implementation Strategy
1.  **Types:** Update `messages.ts` to import `HeroStory`.
2.  **Logic:** Rewrite core logic functions to return `newState` copies instead of mutating.
3.  **Integration:** Update `plugin.ts` to assign returned state.
4.  **Cleanup:** Remove duplicates.
