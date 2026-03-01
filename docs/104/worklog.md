# Advanced Grace System (Doc 104)

## Changes

- **Data Model**: Refactored `QuestTaskData.streak` to replace transient `graceUsed` with persistent `availableGrace`. Added `graceCron` and `lastGraceGrantDate` for accumulation.
- **Logic**: Implemented cron-based grace accumulation. Updated consumption logic to use `availableGrace`. Implemented smart refill logic on completion that restores base allowance while preserving accumulated surplus.
- **UI**: Added "Bonus Grace Cron" setting to global `SettingsView.tsx`.
- **Testing**: Added unit tests confirming grace consumption, refill logic, and surplus preservation.

## Verification

- **Unit Tests**: Passed (18 tests). Confirmed correct behavior for multi-miss scenarios and grace banking.
- **Manual Verification**: N/A (Unit tests cover logic).
