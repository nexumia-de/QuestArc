# Advanced Grace System (Doc 104)

## Goal

Refactor the grace system to store "Available Grace" directly on the task, allowing for accumulation via cron schedules and cleaner consumption logic.

## User Review Required

> [!IMPORTANT]
> This changes the data model from `graceUsed` (transient counter) to `graceAvailable` (persistent bank). Existing tasks will need migration (default to full allowance).

## Proposed Changes

### Data Model (`src/types/quest-v2.ts`)

#### [MODIFY] QuestTaskData.progress.streak

- [NEW] `availableGrace?: number` (Replaces logic reliance on `graceUsed`)
- [NEW] `graceCron?: string` (Optional cron schedule to earn bonus grace)
- [NEW] `lastGraceGrantDate?: string` (ISO string for cron tracking)
- [DELETE] `graceUsed` (Removed from logic, though maybe kept for analytics?) -> User said "replace".

### Logic (`src/lib/logic/StreakLogic.ts`)

#### 1. Grace Consumption

- Calculate `actualMisses`.
- Check `actualMisses <= availableGrace`.
- If survived: `availableGrace -= actualMisses`.

#### 2. Grace Refill (On Completion)

- `availableGrace = Math.max(availableGrace, settings.gracePeriodsPerCycle)`
- _Rationale:_ This ensures the base allowance is always restored, while preserving any accumulated surplus from crons.

#### 3. Grace Accumulation (On Check)

- Check `graceCron`.
- If passed since `lastGraceGrantDate`:
  - `availableGrace += occurrences`
  - Update `lastGraceGrantDate`

### UI (`src/components/SettingsView.tsx` & Task Editor)

- Add **"Bonus Grace Schedule"** input (cron string) to Habit Details.

## Verification Plan

### Automated Tests

- Test accumulation logic (mock time passing).
- Test consumption logic with `availableGrace`.
- Test refill logic (surplus preservation).

### Manual Verification

- Create task with "Every Minute" bonus grace.
- Watch grace increase.
- Miss cycle -> Grace decreases.
- Complete cycle -> Grace refills (min clamped).
