# Worklog: Boss Interaction Logic (ID: 096)

## Changes Implemented

1.  **Manual Completion Guard**:
    - Modified `TaskCompletionHandler` to intercept task completions.
    - If the completed task is identified as a Boss (via `BossService.extractBossConfig`) AND has HP > 0:
      - **Blocks the completion**: Immediately resets `isDone: false`.
      - **Saves the User**: Shows an error snackbar ("⛔ You cannot defeat the boss by clicking...").
      - **Zero Side Effects**: Prevents XP gain or damage calculations from a manual click.
2.  **Auto-Close Verification**:
    - Confirmed `BossService.updateBossHp` automatically sets `isDone: true` when `newHp <= 0`.

## Verification

- **Manual Verification**:
  - **Try to kill the boss manually**:
    1. Start Quest.
    2. Go to Quest Project.
    3. Click the checkbox on the Boss Task.
    4. Result: Checkbox unchecks itself immediately. Error message appears.
  - **Kill the boss via damage**:
    1. Create tasks with `#questarc` (10 dmg).
    2. Complete them until Boss HP hits 0.
    3. Result: Boss Task automatically checks itself off (Strike-through).
