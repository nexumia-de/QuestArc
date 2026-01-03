# Plan: Implement Event-Driven Updates via BroadcastChannel

## Goal
Enable the "Brain" (main process) to notify the "Face" (UI) when state changes (e.g., Task Completed), avoiding Time-Based Polling.

## User Review Required
> [!WARNING]
> This uses `BroadcastChannel`. If the plugin environment creates isolated contexts (different origins), this will fail silently, and the UI will NOT update automatically. We should verify this works.

## Proposed Changes

### Brain (Publisher)
#### [MODIFY] [src/plugin.ts](file:///home/deck/Projects/QuestArc/src/plugin.ts)
- Create `const updateChannel = new BroadcastChannel('quest-arc-updates');`
- In `saveState` or `MessageHandler`, call `updateChannel.postMessage('UPDATE')` whenever state changes.

### Face (Subscriber)
#### [MODIFY] [src/hooks/useStateSync.ts](file:///home/deck/Projects/QuestArc/src/hooks/useStateSync.ts)
- Remove `setInterval`.
- Initialize `const updateChannel = new BroadcastChannel('quest-arc-updates');` in `onMount`.
- `updateChannel.onmessage = () => refetch();`
- Add `cleanup` to close channel.

## Verification Plan
1. **Implementation**:
   - Apply changes.
2. **Test**:
   - Open debug console (if possible) or just watch UI.
   - Complete a task in Host App.
   - Watch if UI updates immediately.
3. **Fallback**:
   - If it doesn't work, we must inform the user that "Event Driven" is blocked by the platform and Polling/Manual is the only option.
