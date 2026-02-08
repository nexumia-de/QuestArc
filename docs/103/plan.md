# 103: Streak Motivation System

Reduce harsh instant-reset mechanics when users miss habit cycles. Make streaks more forgiving to keep users motivated.

---

## Proposed Changes

### Types & Data Models

#### [MODIFY] [state.ts](file:///home/deck/Projects/QuestArc/src/types/state.ts)

Add streak behavior settings to `QuestArcState.settings`:

```typescript
// NEW: in settings interface
streakBehavior?: {
  gracePeriodsPerCycle?: number;   // Default: 1
  decayPercent?: number;           // Default: 25 (lose 25% on miss after grace)
  useTiers?: boolean;              // Default: true
  tierFloors?: {
    bronze: number;   // Default: 0
    silver: number;   // Default: 7
    gold: number;     // Default: 30
    diamond: number;  // Default: 60
  };
};
```

---

#### [MODIFY] [quest-v2.ts](file:///home/deck/Projects/QuestArc/src/types/quest-v2.ts)

Extend `progress.streak` with per-task motivation fields:

```diff
 streak?: {
   current: number;
   target?: number;
   highest?: number;
+  tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
+  graceUsed?: number;        // Shields consumed this cycle
+  totalCompletions?: number; // Lifetime count (never resets)
+  lastMissTimestamp?: number;
 };
```

---

### Core Logic

#### [MODIFY] [StreakLogic.ts](file:///home/deck/Projects/QuestArc/src/lib/logic/StreakLogic.ts)

Refactor the missed-streak block (lines 62-70) to:

1. **Check grace periods first** – if `graceUsed < settings.gracePeriodsPerCycle`, consume a grace and preserve streak.
2. **Apply decay** – if grace exhausted, apply `decayPercent` reduction instead of hard reset.
3. **Enforce tier floors** – never drop below the user's earned tier floor.
4. **Track lifetime completions** – always increment `totalCompletions`.
5. **Update tier** – recalculate tier based on highest streak.

```typescript
// Pseudocode for missed streak handling
if (missedCount > 1) {
  const settings = globalSettings?.streakBehavior ?? DEFAULT_STREAK_BEHAVIOR;
  const graceMax = settings.gracePeriodsPerCycle ?? 1;
  const graceUsed = streak.graceUsed ?? 0;

  if (graceUsed < graceMax) {
    // Consume grace, streak survives
    streak.graceUsed = graceUsed + 1;
  } else {
    // Decay or reset
    const decay = settings.decayPercent ?? 25;
    if (decay > 0) {
      const loss = Math.floor(streak.current * (decay / 100));
      streak.current = Math.max(0, streak.current - loss);
    } else {
      streak.current = 0;
    }

    // Apply tier floor
    if (settings.useTiers) {
      const floor = getTierFloor(streak.tier, settings.tierFloors);
      streak.current = Math.max(streak.current, floor);
    }

    // Reset grace for new cycle
    streak.graceUsed = 0;
  }
}
```

Add helper functions:
- `getTierFloor(tier, floors)` - returns floor value for tier
- `calculateTier(highest)` - returns tier based on highest streak

---

### Settings UI

#### [MODIFY] [SettingsView.tsx](file:///home/deck/Projects/QuestArc/src/components/SettingsView.tsx)

Add a new "Streak Behavior" section with:
- Number input for grace periods (default: 1)
- Number input for decay percent (default: 25)
- Toggle for tier floors (default: enabled)
- Editable tier thresholds (bronze/silver/gold/diamond)

---

## Defaults (User-Configurable)

| Setting | Default | Description |
|---------|---------|-------------|
| `gracePeriodsPerCycle` | 1 | Free misses before decay kicks in |
| `decayPercent` | 25 | Percentage of streak lost per miss (after grace) |
| `useTiers` | true | Enable milestone floor protection |
| `tierFloors.bronze` | 0 | Streak 1-6 resets to 0 |
| `tierFloors.silver` | 7 | Streak 7-29 resets to 7 |
| `tierFloors.gold` | 30 | Streak 30-89 resets to 30 |
| `tierFloors.diamond` | 60 | Streak 90+ resets to 60 |

---

## Verification Plan

### Automated Tests

Extend [game-logic.streak.test.ts](file:///home/deck/Projects/QuestArc/src/lib/game-logic.streak.test.ts):

| Test Case | Description |
|-----------|-------------|
| `should preserve streak when grace period available` | Miss 1 cycle, grace consumed, streak unchanged |
| `should decay streak when grace exhausted` | Miss 2+ cycles, no grace, streak reduced by 25% |
| `should enforce tier floor` | Silver streak (20) decays to max(15, 7) = 15 |
| `should track totalCompletions across resets` | Lifetime count always increments |

**Command:**
```bash
npm run test -- --grep "Streak"
```

### Manual Verification

1. `npm run build`
2. Load plugin in Super Productivity
3. Open QuestArc Settings → verify "Streak Behavior" section appears
4. Change defaults and verify they persist

---

## Summary

Makes QuestArc more forgiving by:
- ✅ 1 free "oops" per cycle (grace period)
- ✅ 25% reduction instead of full reset (decay)
- ✅ Milestone floors (tiers) protect achievements
- ✅ All settings user-configurable
