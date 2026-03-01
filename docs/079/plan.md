# Subtask Progress Visibility

## Goal Description

Currently, subtasks (Habits, Grinds) do not show their progress count (e.g., "0/5") when first created. They only show it after the first interaction or not at all (for Grinds). This implementation ensures that all multi-step subtasks display their progress "from the beginning" and update correctly.

## Proposed Changes

### [Core Logic]

#### [MODIFY] [parsers.ts](file:///home/deck/Projects/QuestArc/src/lib/parsers.ts)

- Update `compileTaskData` to append ` (0/${target})` to the `title` for `GRIND` and `HABIT` tasks if `target > 1`.
- Ensure this change is compatible with existing regex parsers (stripping suffixes).

#### [MODIFY] [game-logic.ts](file:///home/deck/Projects/QuestArc/src/lib/game-logic.ts)

- Update `processTaskCompletion` to enable visual title updates for `GRIND` tasks (currently commented out/incomplete).
- Ensure consistent title formatting: `Title (current/target)`.

## Verification Plan

### Automated Tests

- [ ] Run `npm run test` to verify no regressions.
- [ ] Add new test case in `src/lib/parsers.test.ts`:
  - Verify `compileTaskData('50x Pushups')` returns title `Pushups (0/50)`.
- [ ] Add new test case in `src/lib/game-logic.test.ts`:
  - Verify `processTaskCompletion` updates title correctly for `GRIND` tasks (0->1: `(1/50)`).

### Manual Verification

1. Create a story with a template containing:
   - `50x Pushups` (Grind)
   - `3x @daily Drink Water` (Habit)
2. Start the quest.
3. Observe initial subtasks:
   - Should see `Pushups (0/50)`
   - Should see `Drink Water (0/3)`
4. Tick `Pushups`.
   - Should update to `Pushups (1/50)`.
   - Should remain unchecked (until 50/50).
5. Tick `Drink Water`.
   - Should update to `Drink Water (1/3)`.
