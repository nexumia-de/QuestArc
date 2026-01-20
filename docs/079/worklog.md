# Worklog: Subtask Progress Visibility

## Changes Implemented
- **Parsers Update**: Modified `parsers.ts` to automatically append `(0/target)` to the title of newly created `GRIND` and `HABIT` tasks. This ensures the user sees the requirement immediately (e.g., "Pushups (0/50)").
- **Logic Update**: Updated `game-logic.ts` to dynamically update the task title with the current progress (e.g., "Pushups (1/50)") when the task is checked/progressed.
- **Testing**: Added unit tests in `parsers.test.ts` and `game-logic-subtask.test.ts` to verify title transformations.

## Verification
- Run `npm run test` passed.
- Verified that `Boss` tasks are excluded from this visual change (kept as-is).
- Verified that `GRIND` and `HABIT` tasks correctly display and update their counts.

## Files Modified
- `src/lib/parsers.ts`
- `src/lib/game-logic.ts`
- `src/lib/parsers.test.ts`
- `src/lib/game-logic-subtask.test.ts` (New)
