# Task 039: Undo Task Support

## Context

Users want the ability to "undo" a task in Super Productivity and have QuestArc revert the changes (Boss HP healed, XP removed if applicable).
Currently, QuestArc only listens to `taskComplete`.

## Goal

Implement a `taskUpdate` or `taskUndo` listener that detects when a previously completed task is marked as incomplete, and reverts the game state accordingly.

## Technical Plan

### 1. Detection Strategy

- Use `PluginAPI.registerHook('taskUnDone', ...)` if available? No, docs only show `taskUpdate`.
- Use `PluginAPI.registerHook('taskUpdate', ...)`
- Check if `task.isDone` is `false`.
- **Validation**: Check `state.activeStory.taskProgress[task.title] > 0`.
  - If yes, it means we previously counted this task.
  - Decrement value.
  - Revert Boss Damage.

### 2. Logic (Revert)

- **Boss Healing**:
  - Re-calculate damage using `calculateDamage(task, boss.modifiers)`.
  - `boss.hp = Math.min(boss.maxHp, boss.hp + damage)`
- **Step Regression**:
  - **Constraint**: If the task caused a step completion (and thus XP gain + step advance), we cannot easily undo because the state has shifted to a new step and `taskProgress` was cleared.
  - **Decision**: We will ONLY support undoing actions within the _current_ step. If a user undoes a task that caused a level-up/step-change, we will simply log a warning that "Step regression is not supported".

### 3. Files

- `src/plugin.ts`: Register hook.
- `src/handlers/TaskUndoHandler.ts`: New handler.
- `src/lib/game-logic.ts`: Add `revertTaskCompletion` (optional, or just do it in handler).

## Protocol

No new UI messages needed. This is purely backend logic.
