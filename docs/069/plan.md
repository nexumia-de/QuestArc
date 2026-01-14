# Phase 3: The Game Loop Implementation Plan

## Goal
Implement the core interactive "Game Loop" of QuestArc. This system reacts to user actions (specifically task completion) to update the game state (XP, Level, Boss HP, Story Progress).

## User Review Required
> [!IMPORTANT]
> **Persistence Strategy**: We will use a standard `localStorage` key (`questarc_state`) to sync state between the "Brain" (Plugin Hooks) and the "Face" (UI).
> This ensures that when the Plugin Logic updates the state (e.g., adds XP), the UI (which polls or subscribes to storage events) updates immediately.

## Proposed Changes

### 1. Core Logic & Persistence
*   **[NEW]** `src/lib/persistence.ts`:
    *   `loadState(): QuestArcState`: Loads from localStorage with default fallback.
    *   `saveState(state: QuestArcState)`: Saves to localStorage and potentially triggers a custom event for the UI.
*   **[MODIFY]** `src/lib/game-logic.ts`:
    *   Implement `processTaskCompletion(task, state)`:
        *   Detects if task has `QuestTaskData` (from notes) or Title Parsers (fallback).
        *   Awards XP.
        *   Damages Active Boss (if verified as a boss task or generic hit).
        *   Updates Story Step progress (if applicable).
    *   Implement `checkLevelUp(profile)`: Handles leveling up logic.

### 2. Event Handling (The "Brain")
*   **[NEW]** `src/handlers/task-handler.ts`:
    *   `handleTaskComplete(taskId: string)`: The main orchestrator.
    *   Fetches task details via `PluginAPI.getTasks()`.
    *   Calls `game-logic`.
    *   Saves state.
    *   Triggers Notifications (`PluginAPI.notify`).
*   **[MODIFY]** `src/plugin.ts`:
    *   Register the `PluginAPI.Hooks.TASK_COMPLETE` hook to call `handleTaskComplete`.

### 3. Verification
*   **[NEW]** `src/handlers/task-handler.test.ts`: Unit tests for the orchestration.
*   **[MODIFY]** `src/lib/game-logic.test.ts`: Enhance coverage for boss logic.

## Verification Plan

### Automated Tests
Run `npm run test src/handlers/task-handler.test.ts` to verify:
1.  XP is awarded when a task with `[XP:100]` is completed.
2.  Boss takes damage when a Boss Task is completed.
3.  State is preserved.

### Manual Verification
1.  **Setup**: Start a new Quest (e.g., "Productivity Mastery").
2.  **Action**: Check a task off in Super Productivity.
3.  **Expectation**:
    *   A notification appears: "XP Gained: 100".
    *   Open Quest Dashboard.
    *   XP bar has increased.
    *   If Boss was active, HP bar decreased.
