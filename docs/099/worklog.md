# Worklog: Frequency & Streak Logic (ID: 099) - v2 Refinement

## Changes Implemented

1.  **Native Cron Support (`src/lib/cron.ts`)**:
    - Implemented a lightweight Cron Parser (no dependencies).
    - Supports: `*`, `*/n`, `1,2`, `1-5`, and aliases (`daily`, `weekly`).
    - Allows complex frequency like `*/5 * * * *` (Every 5 mins) or `0 9 * * 1-5` (Workday Daily).

2.  **Robut Anti-Cheat (Double-Dip)**:
    - Calculates the **Next Valid Scheduled Time** based on your Last Update.
    - If you click again before the next window opens, it **Reverts the tick** (keeps it unchecked) but shows a **Success Notification** ("✅ Daily goal already completed!").

3.  **Missed Streak Handling**:
    - Calculates **Missed Opportunities** between Last Update and Now.
    - If you missed 1 or more complete cycles (e.g., skipped yesterday), your **Streak Resets to 0**.

4.  **Sticky Streak (Restored)**:
    - Tasks with `[streak:N]` will **Stay Open** (unchecked) until the target is met.
    - Tasks _without_ a streak target will check off normally.

5.  **Notifications & Boss Guard**:
    - Fixed Boss Guard to only block tasks explicitly typed as `BOSS` (preventing false positives on habits).
    - Added celebratory notifications for Habit/Streak completion.

## Verification

- **Manual Verification**:
  - **Standard Daily**: `[freq:daily]` -> Checks off. Streak +1.
  - **Re-Click (Same Day)**: "✅ Already completed". No Streak Gain.
  - **Missed Streak**: Simulate skipping a day (manipulate JSON `lastUpdated` to 48h ago) -> Click -> Streak resets to 1.
  - **Complex Cron**: `[freq:*/5 * * * *]` -> Checks off.
    - Click at 12:00 -> Done.
    - Click at 12:03 -> "Already Done".
    - Click at 12:05 -> Done. Streak +1.
