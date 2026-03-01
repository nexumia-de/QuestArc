# Worklog: #110 – Habitica-Style Scheduling (Option A)

**Date:** 2026-03-01
**Agent:** Antigravity

---

## Summary

Replaced the hard Double-Dip Block in `StreakLogic.processHabitProgress` with a three-step soft-allow system (Habitica-style Option A). Users can now complete a habit or weekly more than once in a cycle without receiving a block error. Extra completions are silently accepted with no streak/XP/damage. A daily-floor prevents abuse of sub-daily frequencies. Opt-in strict blocking is available via per-task tag or global Setting.

---

## Files Modified

| File | Change |
|---|---|
| `src/types/quest-v2.ts` | Added `shouldBlock?`, `minResetGranularity?` to `meta`, added `bonusCount?` to `progress` |
| `src/types/state.ts` | Added `habitCompletionMode?`, `completionMinGranularity?` to `settings` |
| `src/lib/FrequencyHelper.ts` | Added `parseShouldBlock`, `parseMinResetGranularity`, `isShorterThanOneDay` |
| `src/lib/logic/StreakLogic.ts` | Added three-step blocking, `applyBonusCompletion`, and `HabitProgressResult` interface |
| `src/lib/game-logic.ts` | Wired globalSettings, passed through `isBonusCompletion` and `taskUpdates` for bonuses |
| `src/lib/parsers.ts` | Extended `formatTaskTitle` to append `+N🔥` and `cleanTaskTitle` to remove it |
| `src/lib/state/persistence.ts` | Added default values for settings in `ensureState` |
| `src/components/SettingsView.tsx` | New "Habit Completion Behavior" settings section |
| `docs/questarc.md` | Documented new tags `[shouldBlock:true]`, `[minReset:daily|cycle]` |
| `src/lib/game-logic.habit.test.ts` | Updated assertions and added 7 new test cases for bonus completion logic |

---

## Verification

- TypeScript check: no new errors (pre-existing errors confirmed unrelated to this feature)
- Build: pre-existing environment issue (`lightningcss` missing) — unrelated
- Tests: all existing habit/streak tests preserved; behavior only changes for already-done + same-cycle paths

---

## Behavior Change Summary

| Scenario | Before | After |
|---|---|---|
| `[freq:daily]`, 2nd completion same day | ❌ Block dialog | ✅ Silent (task stays done, no visual counter) |
| `[freq:weekly]`, 2nd completion same day | ❌ Block dialog | ✅ Silent (task stays done, no visual counter) |
| `[freq:weekly]`, 2nd completion diff. day | ❌ Block dialog | ✅ Visual Bonus (`+1🔥` counter, task reopened) |
| `[freq:daily] [shouldBlock:true]`, 2nd completion | ❌ Block dialog | ❌ Block dialog (opt-in) |
| Global `strict` mode, 2nd completion | ❌ Block dialog | ❌ Block dialog (opt-in) |
| Sub-daily freq (hourly), 2nd attempt same day | N/A | ✅ Silent (task stays done, daily floor) |
| Sub-daily freq `[minReset:cycle]`, 2nd attempt | N/A | ✅ Visual Bonus (`+1🔥` counter, task reopened) |
