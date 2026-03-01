# Worklog 101: Habit UI Refinements & streak Fixing 🩹

## Changes

1.  **Next Run Indicator**:
    - Completed Habits now show a persistent tag in the title: `[Next: Mon 10:00]`.
    - Uses absolute weekday/time to avoid ambiguity ("Tomorrow" becoming stale).
    - Automatically removed when the task is reset/clicked for the new cycle.

2.  **Human Readable Dates (`lastDoneDate`)**:
    - Added a new field `lastDoneDate` (ISO String) to `QuestTaskData`.
    - **Read**: Logic now checks this field. If present (and valid), it overrides the internal `lastUpdated` timestamp.
    - **Write**: Logic writes this field automatically on completion.
    - **Purpose**: Allows users to manually edit the JSON notes to "backdate" a task (e.g., set to yesterday) to fix a broken streak.

3.  **Stale Read Guard Refinement**:
    - The anti-double-dip guard now has a **30-second expiry**.
    - Previously, it blocked forever (during session). Now, if you edit the JSON to fix a mistake, you only need to wait 30 seconds (or reload) before clicking again.

4.  **Log Cleanups**:
    - Silenced `BossService` scanning logs by fixing `PluginService.log.debug` implementation to use `console.debug`.

## Verification

- [x] Completing a habit adds `[Next: ...]` tag.
- [x] Editing `lastDoneDate` to yesterday allows "Streak Keeping" behavior.
- [x] Rapid double-clicks are still blocked (within 30s).
- [x] Logs are clean.
