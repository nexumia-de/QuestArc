# Plan: #110 – Habitica-Style Scheduling (Option A)

## Goal

Replace QuestArc's hard "Double-Dip Block" with a Habitica-style "Soft Allow" system.
Users can now complete a habit more times than the cycle target without receiving an error —
extra completions are silently accepted (no streak / XP / damage earned), not blocked.

Additionally, a **Daily-Floor** prevents sub-daily habits from being gamed, and a per-task
`[shouldBlock:true]` tag plus global Settings controls allow opting back into strict blocking.

---

## Changes Made

### Types

- **`quest-v2.ts`**: Added `shouldBlock?: boolean` and `minResetGranularity?: 'daily' | 'cycle'` to `meta`.
- **`state.ts`**: Added `habitCompletionMode?: 'soft' | 'strict'` and `completionMinGranularity?: 'daily' | 'cycle'` to `QuestArcState.settings`.

### FrequencyHelper

New static methods added:
- `parseShouldBlock(questData, title)` – syncs `[shouldBlock:true]` tag into `meta`.
- `parseMinResetGranularity(questData, title)` – syncs `[minReset:daily|cycle]` tag into `meta`.
- `isShorterThanOneDay(freq)` – heuristic for detecting sub-daily CRON expressions (utility, not yet called in main flow).

### StreakLogic (core)

`processHabitProgress` extended with optional `globalSettings` parameter.
Tags are now synced from title to meta at the top of the function.

**Old Double-Dip Guard** (hard block):
```
cyclesPassed === 0 && current >= target -> shouldBlock: true
```

**New Three-Step Decision**:
1. **Step A (Hard Block)**: only if `[shouldBlock:true]` on task OR global `strict` mode.
2. **Step B (Daily Floor)**: if today is same calendar day as last completion → `isBonusCompletion: true` (soft pass-through).
3. **Step C (Soft Allow)**: otherwise (weekly done Mon+Wed) → `isBonusCompletion: true`.

### game-logic.ts

- `processHabitProgress` now passes `habitCompletionMode` and `completionMinGranularity` from state.settings to `StreakLogic`.
- Added early-return for `isBonusCompletion: true` — no XP, no damage, no step progress, no block dialog.
- Added `isBonusCompletion?: boolean` to `processTaskCompletion` return type.

### Persistence

- `ensureState()` now sets default values: `habitCompletionMode = 'soft'`, `completionMinGranularity = 'daily'` for existing states (migration-safe).

### SettingsView.tsx

New "🗓️ Habit Completion Behavior" section with:
- **Completion Mode**: Soft 🌿 / Strict 🔒 toggle buttons.
- **Min Reset Granularity**: Daily / Cycle dropdown.

### Documentation

- `docs/questarc.md` updated with new tag syntax table entries.
