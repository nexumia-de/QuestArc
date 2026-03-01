# Plan: Switch to Event-Driven State Sync

## Goal

Remove time-based polling for state updates and rely on manual API triggers or user interactions ("click via api").

## User Review Required

> [!IMPORTANT]
> **Breaking Behavior**: The UI will no longer automatically update when tasks are completed in the host application. You must click the new "Refresh" button or interact with the plugin to see progress updates.

## Proposed Changes

### Hooks

#### [MODIFY] [src/hooks/useStateSync.ts](file:///home/deck/Projects/QuestArc/src/hooks/useStateSync.ts)

- Remove `setInterval` and `STATE_POLL_INTERVAL_MS` usage.
- Export a `refetch()` function that performs the `REQUEST_SYNC` and updates local state.
- Keep `onMount` initial fetch.

### Components

#### [MODIFY] [src/app/App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)

- Destructure `refetch` from `useStateSync`.
- Use `refetch()` in `startQuest` and `handleSaveStory` instead of manual `MessageService` calls (cleaner).
- Add a "Refresh" button (🔄) to the Header or Footer to allow manual syncing of external events.

#### [MODIFY] [src/components/Header.tsx](file:///home/deck/Projects/QuestArc/src/components/Header.tsx)

- (Optional) Add a refresh icon button if we decide to place it there.

## Verification Plan

1. **Auto-Update Test**:
   - Open plugin.
   - Complete a task in Super Productivity (Host).
   - Verify UI **does NOT** update automatically.
2. **Manual Update Test**:
   - Click "Refresh" (or trigger an action).
   - Verify UI updates to reflect the change.
3. **Action Update Test**:
   - Start a quest.
   - Verify UI updates immediately.
