# Implementation Plan - Task 027

**Goal:** Refactor `EditorView.tsx` into smaller, focused components to improve maintainability and separate concerns.

## ⚠️ User Review Required
> [!NOTE]
> This is a pure refactor. No functionality changes are expected.

## 📂 Architecture Changes

### New File Structure
- `src/components/editor/`
    - `TaskEditor.tsx`: Handles the UI for defining tasks within a step.
    - `CompletionRequirementEditor.tsx`: Handles the "Step Goal" UI (Tasks vs Boss).
    - `StepBuilder.tsx`: A wrapper component for a single step, composing the above two.
- `src/hooks/`
    - `useStoryEditor.ts`: Encapsulates all state logic (adding/removing steps, updating fields).

### Component Responsibilities

1.  **`useStoryEditor.ts`**
    - Manages `storyTitle` and `steps` signals.
    - Exports actions: `addStep`, `removeStep`, `updateStep`, `addTask`, `updateTask`, `removeTask`, `updateCompletion`.

2.  **`TaskEditor.tsx`**
    - Props: `tasks`, `onUpdateTask`, `onRemoveTask`, `onAddTask`.
    - Renders the list of tasks and the "Add Task" button.

3.  **`CompletionRequirementEditor.tsx`**
    - Props: `completion`, `onUpdateType`, `onUpdateConfig`.
    - Renders the dropdown and specific config inputs (e.g., Boss HP).

4.  **`StepBuilder.tsx`**
    - Props: `step`, `index`, `onUpdate`, `onRemove`.
    - Renders Step Title, XP, `TaskEditor`, and `CompletionRequirementEditor`.

5.  **`EditorView.tsx`** (Main Entry)
    - Uses `useStoryEditor` to get state and actions.
    - Renders the Story Title input.
    - Maps over steps to render `StepBuilder`.
    - Handles Save/Cancel.

## 📋 Step-by-Step Implementation

### 1. Extract Logic to Hook
- [ ] [NEW] `src/hooks/useStoryEditor.ts`: Move all state manipulation logic here.

### 2. Create Sub-Components
- [ ] [NEW] `src/components/editor/TaskEditor.tsx`: Extract task management UI.
- [ ] [NEW] `src/components/editor/CompletionRequirementEditor.tsx`: Extract completion logic UI.
- [ ] [NEW] `src/components/editor/StepBuilder.tsx`: Extract the individual step card.

### 3. Reassemble EditorView
- [ ] [MODIFY] `src/components/EditorView.tsx`: Replace inline code with new components and hook.

## 🧪 Verification
- [ ] **Automated:** `npm run typecheck`
- [ ] **Manual:**
    1.  Open the Story Editor.
    2.  Create a multi-step story with tasks and boss completion.
    3.  Verify all inputs work (typing, checkboxes, selects).
    4.  Save and verify data is persisted correctly.
    5.  Edit an existing story and verify data loads correctly.
