# Implementation Plan - Task 028

**Goal:** Refactor `plugin.ts` to reduce its size and complexity by extracting logic into dedicated service and handler modules.

## ⚠️ User Review Required

> [!NOTE]
> This refactor aims to separate concerns: initialization, task creation, message handling, and task completion logic.

## 📂 Architecture Changes

### New File Structure

- `src/services/`
  - `TaskService.ts`: `createTasksForStep`, `updateTaskTitle` - Encapsulates standard `PluginAPI` task interactions.
  - `HeaderService.ts`: `updateHeader` - Encapsulates `PluginAPI` header interactions.
  - `PluginService.ts`: Facade for `PluginAPI` including persistence and logging.
- `src/handlers/`
  - `TaskCompletionHandler.ts`: `handleTaskComplete` - Contains the complex logic for XP, Boss Damage, and Step Progression.
  - `MessageHandler.ts`: `handlePluginMessage` - Contains the switch statement for `REQUEST_SYNC`, `SAVE_STORY`, etc.

### Component Responsibilities

1.  **`src/plugin.ts`** (Main Entry)
    - Initializes the plugin.
    - Sets up the `onMessage` listener (delegating to `MessageHandler`).
    - Sets up the `taskComplete` hook (delegating to `TaskCompletionHandler`).
    - Maintains the runtime `state`.

2.  **`TaskService.ts`**
    - Handles "Auto-create tasks" logic.
    - Handles "Rename host task" logic.

3.  **`HeaderService.ts`**
    - Handles updates to the header button based on state (Level vs Boss HP).

4.  **`TaskCompletionHandler.ts`**
    - Takes `state`, `task`, and `PluginAPI`.
    - Returns the `newState` (functional approach) or executes side effects via `PluginAPI` (snackbars).
    - _Decision:_ Pass `PluginAPI` to it or keep it pure? Since it needs to show snacks and update tasks, passing `PluginAPI` or the `TaskService` is required. I will inject `TaskService` and `PluginAPI` facade.

5.  **`MessageHandler.ts`**
    - Handles the switch keys.
    - Modifies state and triggers save.

## 📋 Step-by-Step Implementation

### 1. Create Services

- [ ] [NEW] `src/services/PluginService.ts`: Typed wrapper for global `PluginAPI`.
- [ ] [NEW] `src/services/TaskService.ts`: Extract `createTasksForStep`.
- [ ] [NEW] `src/services/HeaderService.ts`: Extract `updateHeader`.

### 2. Create Handlers

- [ ] [NEW] `src/handlers/TaskCompletionHandler.ts`: Extract the `taskComplete` hook logic.
- [ ] [NEW] `src/handlers/MessageHandler.ts`: Extract the `onMessage` logic.

### 3. Refactor Plugin.ts

- [ ] [MODIFY] `src/plugin.ts`: Wire everything together.

## 🧪 Verification

- [ ] **Automated:** `npm run typecheck`
- [ ] **Manual:**
  1.  Standard regression test:
      - Load plugin.
      - Verify Header appears.
      - Check Sync (Dashboard loads).
      - Complete a task -> Verify XP/Step progress.
      - Save a story.
