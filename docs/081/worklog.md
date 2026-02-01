# Worklog: Add #QuestArc Tag

## Changes
- Modified `src/services/compiler.service.ts` to append `#QuestArc` to task titles during quest compilation/cloning.
- Modified `src/services/manager.service.ts` to append `#QuestArc` to task titles during step injection.
- Verified `src/services/TaskService.ts` already had the logic.
- Updated `src/services/compiler.service.test.ts` to reflect the changes and fix outdated test data/expectations.

## Verification
### Automated Tests
- Ran `vitest src/services/compiler.service.test.ts`.
- Confirmed tasks are created with `#QuestArc` appended to the title.
- Confirmed `cleanTaskTitle` / `formatTaskTitle` logic handles the tag correctly (by checking logic flow: tag persists as part of base title).

### Manual Check
- Code review passed.
- Logic is consistent across all identified task creation points.
