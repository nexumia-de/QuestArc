# Worklog 066: Core Logic (Regex Parsers)

## Summary
Implemented the initial phase of the "Headless RPG" architecture by creating the data models and regex parsers for task titles. This allows the system to interpret standard text titles as game objects (Bosses, Habits, Grinds, etc.).

## Changes
- **Created** `src/types/quest-v2.ts`: Defined the new `QuestTaskData` interfaces.
- **Created** `src/lib/parsers.ts`: Implemented `parseXpTag`, `parseTaskType`, and `compileTaskData`.
- **Created** `src/lib/parsers.test.ts`: Added unit tests for the parsers.
- **Updated** `docs/ROADMAP.md`: Checked off the Regex Parsers task.
- **Fixed** `src/lib/parsers.ts`: Added null checks to resolve TypeScript lint errors.

## Verification
Ran `vitest src/lib/parsers.test.ts`.

**Results:**
```
 ✓ src/lib/parsers.test.ts (12 tests) 6ms
   ✓ QuestArc v2 Parsers (12)
     ✓ parseXpTag (3)
     ✓ parseTaskType (7)
     ✓ compileTaskData (2)
```

All 12 tests passed successfully.
