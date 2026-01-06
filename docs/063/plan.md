# Fix Infinite XP Bug in Quest Completed Mode

Prevent XP farming by continuing to complete tasks after a quest is already marked as completed.

## Proposed Changes

### Logic

#### [TaskCompletionHandler.ts](file:///home/deck/Projects/QuestArc/src/handlers/TaskCompletionHandler.ts)

- **Early Return**:
  - Add a check at the beginning of `handle()` method.
  - If `state.activeStory.isCompleted` is true, return immediately without processing task completion or awarding XP.

```typescript
if (state.activeStory.isCompleted) {
    PluginService.log.info('Task completed for completed quest. Ignoring.');
    return;
}
```

## Verification Plan

### Manual Verification
1. Load the plugin with a quest near completion.
2. Complete the final step of the quest.
   - Verify "QUEST COMPLETED!" and XP gain.
3. Complete **another separate task** (e.g., from a different project or a new task).
4. **Expect**:
   - NO "QUEST COMPLETED!" message.
   - NO repeat XP gain.
   - NO "Level Up" (unless from legitimate sources, though this fix prevents the exploit).

### Automated Tests
- Run `npm run build` to ensure type safety.
