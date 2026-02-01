# Plan 100: Next Run Indicator ⏳

## Goal
Always show the user when a completed habit will be available again.

## User Request
"Show the user always that the habit is already ticked and next avail timeslot is at xy"

## Proposed Changes

### 1. `src/lib/game-logic.ts`
-   In `processHabitProgress`:
    -   Calculate `nextRun` using `CronHelper.getNextOccurrence`.
    -   Format `nextRun` (e.g., "Tomorrow", "in 5h", or absolute time).
    -   Append/Update a status tag in the title: `Task Name [1/1] ✅ [Next: Tomorrow]`
    -   Ensure this tag is REMOVED when the task resets or becomes active again.

### 2. `src/lib/cron.ts`
-   Ensure `getNextOccurrence` is exposed and reliable.
-   Add `formatDuration(ms)` helper? Or use `Intl.RelativeTimeFormat`.

## Title Format
Current: `Task 1/2 🔥`
New (Completed): `Task 1/2 🔥 [Next: 14:00]`

## UX
-   When `isDone: true` (Habit completed for cycle):
    -   Title updates to include `[Next: ...]`.
-   When `isDone: false` (Sticky Streak / Active):
    -   No "Next" tag (Available now).

## Verification
1.  Complete a Daily Habit.
2.  Check Title: Should say `[Next: ...]` with correct future time.
3.  Wait until time passes (or fake it).
4.  Check Title: Should clear the tag (on next interaction/scan?).
    *   *Self-correction*: Titles only update when we interact with them or when the specific refresh logic runs. If we rely on `TaskCompletionHandler`, it only updates on click.
    *   If the user does nothing, the title says `[Next: Tomorrow]` forever?
    *   When the new day comes, the user sees `[Next: Tomorrow]` (now incorrect) until they click it?
    *   When they click it, `cyclesPassed` > 0, so it resets, clears the tag, and processes the new click.
    *   Acceptable for v1.
