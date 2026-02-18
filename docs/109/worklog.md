# Issue #109 — Habit Stacking Worklog

## Summary
Implemented habit stacking: habits with `[stack:ID]` persist streak data across quest steps via a "Clone & Hydrate" pattern. Added `SKIP_STEP` message for UI-triggered step advancement.

## Changes Made

### Types
- **`src/types/quest-v2.ts`** — Added `stack?: string` to `QuestTaskData.meta`
- **`src/types/payloads.ts`** — Aligned `TaskNoteJSON` with full streak fields (`tier`, `totalCompletions`, `availableGrace`, `stack`, `persistent`, `boss`)
- **`src/types/messages.ts`** — Added `SKIP_STEP` to `MESSAGE_TYPES` and `SkipStepMessage` interface

### Parsers
- **`src/lib/parsers.ts`** — Parse + strip `[stack:X]` tag globally. Updated title generation to use `data.progress.streak.current` instead of hardcoded `0`.

### Compiler
- **`src/services/compiler.service.ts`** — `extractStackData()` + streak injection in `cloneTask()`.
  - Added **title regeneration** to reflect carried-over streak (e.g. `3/5 🔥`).
  - Added **done-state carry-over**: If `lastDoneDate` indicates the task is still in cooldown (via `CronHelper`), the new task is marked `isDone=true` and gets the `[Next: Date Time]` tag appended.

### Handler & UI
- **`src/handlers/MessageHandler.ts`** — `SKIP_STEP` case: force-completes subtasks/root, finds template, calls `compileNextTask` with stacking.
- **`src/hooks/useQuestArc.ts`** — Added `skipStep()` function
- **`src/components/QuestDashboard.tsx`** — ⏭️ Skip button with confirm dialog

### Documentation
- **`docs/SYNTAX_GUIDE.md`** — Section F for `[stack:ID]`, added **Best Practice** note for `[persistent]` usage (Last Step Only).
- **`docs/DATA_MODELS.md`** — `meta.stack` field
- **`docs/MESSAGE_PROTOCOL.md`** — `SKIP_STEP` and `UPDATE_SETTINGS` messages

## Tests
- **`src/lib/parsers.test.ts`** — 9 new tests (5 stack parsing + 4 cleanTaskTitle), all pass
- All 26 parser tests pass
- Build passes with no warnings

## Carry-Over Rules
| Field | Behavior |
|---|---|
| `streak.current` | Carried over |
| `streak.highest` | Carried over |
| `streak.tier` | Carried over |
| `streak.totalCompletions` | Carried over |
| `streak.availableGrace` | Carried over |
| `progress.lastDoneDate` | Carried over |
| `progress.current` | Reset to 0 |
| `streak.target` | New step's template value |
| `progress.target` | New step's template value |
| Task title | New step's template value |
