# 092 - Dynamic Boss Context (Sibling Damage)

## Goal Description

The user reports that completing subtasks fails to damage a "Boss" that exists as a sibling subtask.
Root Cause: The transition to "Project-Based Quests (V2)" bypasses the static `state.stories` definitions. `game-logic.ts` relies on `activeStoryDef` to find the `currentStep` and `activeBoss`. Without these, no damage logic runs.

We will reimplement Boss detection to be **Dynamic**:

1.  When a task completes, we scan its **Siblings** (other tasks with the same `parentId`, or root tasks in the same `projectId`).
2.  If a sibling is identified as a **Boss Task** (Name + `[HP:N]`), we treat the current context as a Boss Fight.
3.  We virtually initialize `state.activeBoss` (if not already set) matching this sibling boss.
4.  We allow damage to flow to this boss.

**Update (2026-01-25):** Additionally, the boss should appear in the dashboard as "active" **as soon as the plugin sees it**, not just after a sibling task is completed. This is achieved via proactive detection on `currentTaskChange` and `taskUpdate` hooks.

## Proposed Changes

### Service Layer (`src/services/BossService.ts`) [NEW]

- Centralized boss detection logic (`scanForSiblingBoss`).
- Uses regex to identify tasks matching the Boss pattern `[HP:N]`.

### Handler Layer (`src/handlers/TaskCompletionHandler.ts`)

- Refactored to use `BossService.scanForSiblingBoss`.
- If a boss is found, initializes `state.activeBoss` and creates a Synthetic Step to trigger damage.

### Handler Layer (`src/handlers/ContextHandler.ts`) [NEW]

- Handles proactive boss detection on `taskUpdate` and `currentTaskChange` hooks.
- If the current task (or any sibling) is a boss, sets `state.activeBoss`.
- Preserves existing boss HP if the boss name matches.

### Plugin Entry (`src/plugin.ts`)

- Registers `currentTaskChange` hook to call `ContextHandler.handle`.
- Updates `taskUpdate` hook to also call `ContextHandler.handle`.

## Verification

### Automated Tests

- `src/handlers/TaskCompletionHandler.test.ts`: Verifies damage is dealt.
- `src/handlers/ContextHandler.test.ts`: Verifies proactive boss detection and HP preservation.

### Manual Verification

1.  Create a Quest Project.
2.  Add a Root Task "Chapter 1".
3.  Add Subtask "Dragon [HP:50]" (The Boss).
4.  Add Subtask "Attack".
5.  **Expected**: Dragon should appear in the dashboard immediately when "Dragon [HP:50]" is created or when any task is selected.
6.  Complete "Attack".
7.  Verify Snack: "Dealt 10 damage to Dragon!"
