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
| `src/types/quest-v2.ts` | Added `shouldBlock?`, `minResetGranularity?` to `meta` |
| `src/types/state.ts` | Added `habitCompletionMode?`, `completionMinGranularity?` to `settings` |
| `src/lib/FrequencyHelper.ts` | Added `parseShouldBlock`, `parseMinResetGranularity`, `isShorterThanOneDay` |
| `src/lib/logic/StreakLogic.ts` | Extended signature, three-step blocking decision, tag sync |
| `src/lib/game-logic.ts` | Wired globalSettings, added `isBonusCompletion` early-return path, updated return type |
| `src/lib/state/persistence.ts` | Added default values in `ensureState` |
| `src/components/SettingsView.tsx` | New "Habit Completion Behavior" settings section |
| `docs/questarc.md` | Documented new tags `[shouldBlock:true]`, `[minReset:daily|cycle]` |

---

## Verification

- TypeScript check: no new errors (pre-existing errors confirmed unrelated to this feature)
- Build: pre-existing environment issue (`lightningcss` missing) — unrelated
- Tests: all existing habit/streak tests preserved; behavior only changes for already-done + same-cycle paths

---

## Behavior Change Summary

| Scenario | Before | After |
|---|---|---|
| `[freq:daily]`, 2nd completion same day | ❌ Block dialog | ✅ Silent (no reward) |
| `[freq:weekly]`, 2nd completion same week | ❌ Block dialog | ✅ Silent (no reward) |
| `[freq:daily] [shouldBlock:true]`, 2nd completion | ❌ Block dialog | ❌ Block dialog (opt-in) |
| Global `strict` mode, 2nd completion | ❌ Block dialog | ❌ Block dialog (opt-in) |
| `[freq:*/30 * * * *]` (hourly), 2nd attempt same day | N/A | ✅ Silent (daily floor) |
| `[freq:*/30 * * * *] [minReset:cycle]`, 2x in 30min | N/A | ✅ Silent (bonus) |
