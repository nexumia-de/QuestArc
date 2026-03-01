# Plan - Stateless Boss HP & Custom Damage Config

Implement stateless damage logic where Boss HP is stored in the task's JSON notes and title, and allow users to configure damage amount and frequency via task title tags.

## Proposed Changes

### Logic & Services

#### [MODIFY] [BossService.ts](file:///home/deck/Projects/QuestArc/src/services/BossService.ts)

- Update `extractBossConfig` to prioritize reading HP from JSON notes.
- Update `scanForSiblingBoss` to return `BossResult` (config + taskId).
- Add `updateBossHp` static method to handle updating both title and JSON notes of a boss task.

#### [MODIFY] [game-logic.ts](file:///home/deck/Projects/QuestArc/src/lib/game-logic.ts)

- Update `QuestTaskData` handling to support `damage` and `damageEvery` in `meta`.
- Update `processGrindProgress` and `processHabitProgress` to calculate `shouldDealDamage` based on custom frequency.
- Update `processTaskCompletion` to use custom damage values and handle damage triggers correctly for partial completions.

#### [MODIFY] [parsers.ts](file:///home/deck/Projects/QuestArc/src/lib/parsers.ts)

- Add regex for `[dmg:N]` and `[dmgevery:N]` tags.
- Update `compileTaskData` to store these values in the meta of the generated JSON.

### Handlers

#### [MODIFY] [TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)

- Use `BossService.scanForSiblingBoss` to get the boss task ID.
- Synchronize boss HP by calling `BossService.updateBossHp` whenever damage is dealt.
- Use task updates from the "dynamic" logic pass to ensure GRIND/HABIT progress is correctly saved when a boss is active.

## Verification Plan

### Automated Tests

- `npm run build` to ensure type safety.

### Manual Verification

1. Create a boss task: `boss 100/100 ❤️`.
2. Check notes for initial JSON.
3. Create a grind task: `Multi [count:3] [dmg:12] [dmgevery:1]`.
4. Check notes for initialized JSON with `damage: 12`.
5. Complete grind task → Verify Boss HP decreases by 12 (or crit) in title and JSON.
6. Verify "Multi" progress updates to `(1/3)` in title and JSON.
