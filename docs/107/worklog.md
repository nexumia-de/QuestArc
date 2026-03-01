# Worklog - Fix Streak Reset on Offline

## 1. Analysis

- **Issue**: Habit subtask streaks reset to 0 after being offline for a day.
- **Root Cause**: `TaskService.checkDailyResets()` ran on plugin init and hard-reset `streak.current = 0` using a simple yesterday-check (`lastCompletionTime >= startOfYesterday`). This bypassed the grace/decay/tier-floor logic in `StreakLogic.processHabitProgress()`.
- **Impact**: All streak progress was lost instead of being gracefully decayed.

## 2. Implementation

- **Removed** `checkDailyResets()` method from `src/services/TaskService.ts`
- **Removed** `await TaskService.checkDailyResets()` call from `src/plugin.ts` init
- **Cleaned up** unused `cleanTaskTitle`/`formatTaskTitle` imports and duplicate `HeaderService.updateHeader()` call
- **Rationale**: Streak decay is already handled correctly by `StreakLogic.processHabitProgress()` on task completion (reactive), making the proactive init-based reset redundant and harmful.

## 3. Verification

- **Build**: `npm run build` passed.
- **Tests**: All 21 streak/habit tests passed (`game-logic.streak-motivation.test.ts`, `game-logic.habit-refactor.test.ts`).
