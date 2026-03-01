# Implementation Plan - Remote Damage Persistence

The goal is to ensure that damage dealt to the Active Boss via Custom Tags (e.g. from the Inbox) is actually persisted to the "Boss Task" (the task with the HP bar) in the active Quest Project. Currently, this only works if the Boss Task is a sibling of the completed task.

## User Review Required

> [!IMPORTANT]
> This change ensures that the "Boss Task" (e.g., "Dragon 100/100 ❤️") in your Quest Project is updated even if you are working in your Inbox. This respects the "Game Cache vs Source of Truth" split by ensuring the Task itself (Source of Truth) is updated via the API.

## Proposed Changes

### Handlers

#### [MODIFY] [TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)

- Modify the "Update Boss Task" section at the end of `handle()`.
- Add logic: If `finalDamage > 0` AND `bossTaskId` is missing AND we have an `activeStory.id`:
  - Call `BossService.scanProjectForBoss(activeStory.id)` to find the boss task in the active quest.
  - If found, use its `taskId` and `originalTitle` to proceed with `BossService.updateBossHp`.

## Verification Plan

### Automated Tests

- We cannot easily unit test this integration (TaskContext + API calls) without extensive mocking, but the logic is straightforward API orchestration.
- We will rely on Manual Verification.

### Manual Verification

1.  **Setup**:
    - Ensure an Active Quest is running (with a Boss Task, e.g., "Boss 100/100").
    - Ensure a Custom Tag is configured (e.g., `#test` -> 10 dmg).
2.  **Action**:
    - Go to **Inbox** (or a different project).
    - Create a task "Test Task #test".
    - Complete the task.
3.  **Expectation**:
    - Toast notification: "💥 Dealt 10 damage...".
    - Boss Bar (Header/Dashboard): Updates to 90/100.
    - **CRITICAL**: Go to the **Quest Project**. The Boss Task title should now read "Boss 90/100 ❤️".
