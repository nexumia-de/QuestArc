# Worklog - Task 038

## Quest Dashboard Clear

### Objectives
- Clear dashboard state after quest completion.
- Ensure "Current Story Step" is hidden when no quest is active.
- Verify "New Quest" flow still works.

### Work Log
- [x] Created plan.md
- [x] Updated `QuestArcState` to allow nullable active story ID.
- [x] Updated `MessageHandler` to clear active story ID on completion.
- [x] Updated `story.ts` helpers to handle null ID.
- [x] Updated `DashboardView.tsx` to show empty state when no quest is active.
- [x] Updated `App.tsx` for optimistic UI updates.
- [x] Verified build success.
