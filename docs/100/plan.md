# Plan: Undo Feature (Task & Boss Damage)

## User Review Required

> [!NOTE]
> **Storage Strategy**: Per user feedback, we will use the **Root Task** (the main parent task of the current step) to store the undo history. This avoids creating a separate "Quest Log" task and keeps the history contextual.
>
> _Note: To "Global Undo" from the header, we will scan the active project's root tasks to find the most recent log entry._

## Proposed Changes

### Logic & Services (Brain)

#### [NEW] `src/services/UndoService.ts`

- **Purpose**: Centralized service to handle undo operations.
- **Methods**:
  - `logAction(rootTaskId: string, action: UndoAction)`: Appends an action to the specified Root Task's notes.
  - `undoLastAction(state: QuestArcState)`:
    - Scans all Root Tasks in the active Project.
    - Parses their notes to find the most recent `UndoAction` (checking timestamps).
    - Reverts that action.
    - Removes the log entry from the Root Task.
    - Returns updated State.

#### [MODIFY] `src/handlers/TaskCompletionHandler.ts`

- Integrate with `UndoService`.
- When valid damage/completion occurs, call `UndoService.logAction`.

#### [MODIFY] `src/handlers/TaskUndoHandler.ts`

- Refactor to use `UndoService` or align logic.
- Currently, Sp triggers this when a user _manually_ unchecks a box. We should ensure this also consults the Log if available, to revert damage correctly.

### UI (Face)

#### [MODIFY] `src/components/Header.tsx`

- Add an **Undo Button** (`↩️`) near the Boss/Stats area.
- Click handler triggers `PluginAPI.postMessage({ type: 'UNDO' })`.

#### [MODIFY] `src/handlers/MessageHandler.ts`

- Handle `'UNDO'` message type.
- Call `UndoService.undoLastAction`.

## Verification Plan

### Manual Verification

1.  **Setup**: Start a valid Quest (e.g. "Kill the Dragon").
2.  **Action**: Complete a task that deals damage (e.g., "Hit Dragon [dmg:10]").
3.  **Verify**:
    - Boss HP decreases.
    - "Quest Log" task is created/updated in the project (visible in Super Productivity task list).
4.  **Action**: Click the new "Undo" button in the QuestArc Header.
5.  **Verify**:
    - Boss HP restores.
    - Task is unchecked in Super Productivity.
    - Notification appears: "Undid action...".
6.  **Edge Case**: Click Undo multiple times (should handle empty log).
