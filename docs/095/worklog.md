# Worklog: Remote Damage Persistence

## Changes Implemented

1.  **Architecture Compliance**: Addressed "Split Brain" violation where game state (activeBoss) was updating but the binding Task (Source of Truth) wasn't being updated when damaged from remote contexts (Inbox).
2.  **TaskCompletionHandler**:
    - Modified update logic to check for `activeStory.id` if no local sibling boss is found.
    - Uses `BossService.scanProjectForBoss(activeStory.id)` to locate the remote boss task.
    - Persists the new HP to that remote task's title/notes.

## Verification

- **Manual Verification**:
  - Start Quest (Dragons). activeBoss = 100/100.
  - Go to Inbox.
  - Complete `#questarc` task (10 dmg).
  - Notification: "Dealt 10 Damage".
  - Check Quest Project: Boss Task should read `... 90/100`.
  - Check State: App reload should preserve 90/100 (loaded from task).
