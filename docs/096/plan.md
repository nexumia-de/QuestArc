# Implementation Plan - Boss Task Logic (ID: 096)

Implement logic to handle direct interactions with the Boss Task, specifically ensuring it behaves like a "Boss" and not a regular task.

## User Review Required

> [!IMPORTANT]
> **Manual Boss Completion blocked**: If you try to tick the Boss Task (kill it) while it still has HP, it will immediately un-tick itself. You must deal damage to kill it.

## Proposed Changes

### Handlers

#### [MODIFY] [TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)

1.  **Prevent Manual Completion**:
    -   At the start of `handle()`: Check if `task` is a Boss (via `BossService.extractBossConfig`).
    -   If it IS a Boss:
        -   Check `hp` from config.
        -   If `hp > 0`:
            -   Log "Manual kill attempt blocked".
            -   Call `PluginService.api.updateTask(task.id, { isDone: false })` immediately.
            -   Show Snack: "⛔ You cannot defeat the boss by clicking! Attack it with tasks!"
            -   Return early (do not process XP/Damage/etc.).

2.  **Auto-Close on Death**:
    -   Verify `BossService.updateBossHp` logic ensures `isDone: true` when `newHp <= 0`. (Already exists, just verifying logic flow).

## Verification Plan

### Manual Verification
1.  **Block Manual Kill**:
    -   Start a Quest (Boss HP: 100/100).
    -   Go to Quest Project.
    -   Click the Checkmark on "Boss 100/100".
    -   **Expectation**: Checkmark instantly reverts to unchecked. Toast appears: "You cannot defeat the boss...". HP remains 100.
2.  **Auto-Close**:
    -   Damage the boss to 0 (using tags or console dev tools).
    -   **Expectation**: Boss Task marks itself as Done (strikethrough).
