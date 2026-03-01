# Implementation Plan - Task 025

**Goal:** Fix the "red x" (delete task) button in the Story Editor not updating the UI when clicked.

## ⚠️ User Review Required

> [!IMPORTANT]
> None. This is a bug fix for internal UI state management.

## 🧠 Brain (`src/plugin.ts`)

- **State Changes:** None.
- **Persistence:** None.
- **Logic:** None.

## 🎨 Face (`src/app/` & SolidJS)

- **Visuals:** None.
- **Components:** `src/components/EditorView.tsx` - Fix `removeTask` to use immutable state updates.
- **Protocol:** None.

## 📋 Step-by-Step Implementation

### 1. Face (UI)

- [ ] [MODIFY] [EditorView.tsx](file:///home/deck/Projects/QuestArc/src/components/EditorView.tsx): Update `removeTask` function to correctly create a new object reference for the modified step, ensuring SolidJS reactivity triggers.

## 🧪 Verification

- **Automated:** `npm run typecheck`, `npm run lint`
- **Manual:**
  1. Open Story Editor.
  2. Add a task.
  3. Click the "red x" to remove it.
  4. Verify the task disappears from the list immediately.
