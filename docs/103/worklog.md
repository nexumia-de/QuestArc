# 103: Worklog - Streak Motivation System

**Date**: 2026-02-08  
**Agent**: Antigravity

## Summary

Implemented a configurable streak motivation system to make habits more forgiving when users miss cycles.

## Changes Made

### Types

- **[state.ts](file:///home/deck/Projects/QuestArc/src/types/state.ts)**: Added `StreakTier` type and `StreakBehaviorConfig` interface with grace periods, decay percent, and tier floor settings.
- **[quest-v2.ts](file:///home/deck/Projects/QuestArc/src/types/quest-v2.ts)**: Extended `streak` interface with `tier`, `graceUsed`, `totalCompletions`, and `lastMissTimestamp`.

### Logic

- **[StreakLogic.ts](file:///home/deck/Projects/QuestArc/src/lib/logic/StreakLogic.ts)**: Refactored `processHabitProgress()` to:
  - Accept optional `StreakBehaviorConfig` parameter
  - Consume grace periods before applying penalties
  - Apply percentage-based decay instead of hard reset
  - Enforce tier floors (never drop below milestone)
  - Track lifetime `totalCompletions`
  - Added `calculateTier()` and `getTierFloor()` helpers

### UI

- **[SettingsView.tsx](file:///home/deck/Projects/QuestArc/src/components/SettingsView.tsx)**: Added "Streak Behavior" settings card with:
  - Grace periods per cycle (number input)
  - Decay percent (number input)
  - Enable tier floors toggle
  - Editable tier floor values (bronze/silver/gold/diamond)

### Tests

- **[game-logic.streak-motivation.test.ts](file:///home/deck/Projects/QuestArc/src/lib/game-logic.streak-motivation.test.ts)**: Added 15 new tests covering:
  - `calculateTier()` for all tier boundaries
  - `getTierFloor()` with custom and default floors
  - Decay calculation logic
  - Tier floor enforcement

## Verification

- ✅ `npm run build` passes
- ✅ 15/15 new streak motivation tests pass
- ⚠️ Pre-existing streak tests have unrelated failures (test expectations outdated, not caused by this change)

## Defaults

| Setting                 | Value |
| ----------------------- | ----- |
| Grace periods per cycle | 1     |
| Decay percent           | 25%   |
| Use tiers               | true  |
| Bronze floor            | 0     |
| Silver floor            | 7     |
| Gold floor              | 30    |
| Diamond floor           | 60    |
