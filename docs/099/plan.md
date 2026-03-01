# Refined Implementation Plan - Frequency & Streak Logic (ID: 099) v2

Address user feedback regarding complex cron logic, double-dip guards based on time ranges, and missed streak handling.

## User Review Required

> [!NOTE]
> **No External Dependencies**:
> I will implement a **Lightweight Cron Helper** (`src/lib/cron.ts`) to handle standard Cron syntax (`*`, `*/n`, ranges `1-5`, lists `1,2`) natively.
> This supports "Complex Cron" without bloating the plugin.

## Proposed Changes

### New File: `src/lib/cron.ts`

- Implement `parseCron(expression)`: Parses 5-part cron string.
- Implement `nextDate(expression, fromDate)`: Finds the next valid execution time.
- Implement `getOccurrencesCount(expression, since, now)`: Counts valid slots for streak checks.

### Logic

#### [MODIFY] [game-logic.ts](file:///home/deck/Projects/QuestArc/src/lib/game-logic.ts)

1.  **Import `CronHelper`** from `./cron`.
2.  **Frequency Parsing**:
    - `daily` -> `0 0 * * *`
    - `weekly` -> `0 0 * * 1` (Monday)
    - `[freq:CRON]` -> Pass raw string.
3.  **Process Logic**:
    - **Double-Dip**: `CronHelper.nextDate(lastUpdated)`. If `now < nextDate`, Block.
    - **Missed Streak**: `CronHelper.getOccurrencesCount(lastUpdated, now)`. If count > 1, Reset Streak.

#### [MODIFY] [TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)

1.  Handle the `ALREADY_DONE` block with a Success message (as agreed).

## Verification Plan

### Automated / Simulation

1.  **Install**: `npm install cron-parser`.
2.  **Manual Test**:
    - Task: `Test [freq: */5 * * * *]` (Every 5 mins).
    - Click -> Done. Streak 1.
    - Click (1 min later) -> Blocked (Too early).
    - Wait 5 mins -> Click -> Done. Streak 2.
    - Wait 15 mins (Miss one cycle) -> Click.
    - Result: Streak resets (or counts as 1).
