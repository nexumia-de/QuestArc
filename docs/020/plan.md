# Story Editor Enhancements Plan

## Goal

Decouple task creation from completion requirements in the Story Editor. Users should be able to define _multiple_ tasks to be created for a single step, and separately define what is required to complete that step (e.g., complete all, complete 2 of them, complete specific ones, or defeat a boss).

## Proposed Changes

### Data Model (`src/types/state.ts`)

#### [MODIFY] [state.ts](file:///home/deck/Projects/QuestArc/src/types/state.ts)

- Refactor `StoryStep` to separate creation and completion.

```typescript
export interface TaskDefinition {
  title: string;
  notes?: string;
  // future: priority, tags, etc.
}

export type CompletionType = "all_tasks" | "any_count" | "boss_defeat";

export interface CompletionRequirement {
  type: CompletionType;
  config?: {
    count?: number; // for 'any_count'
    boss?: BossConfig; // for 'boss_defeat'
  };
}

export interface StoryStep {
  id: number;
  title: string;

  // 1. Creation: What happens when this step starts?
  tasksToCreate?: TaskDefinition[];

  // 2. Requirements: What is needed to finish this step?
  completion: CompletionRequirement;

  xpReward: number;
  nextStepId?: number | null;
}
```

### UI Components (`src/components/EditorView.tsx`)

#### [MODIFY] [EditorView.tsx](file:///home/deck/Projects/QuestArc/src/components/EditorView.tsx)

- **Step Editor Section**:
  - **Header**: Step Title, XP Reward.
  - **Creation Panel**: List of tasks to create. "Add Task" button.
  - **Requirements Panel**:
    - Dropdown: "Complete All Created", "Complete X Tasks", "Defeat Boss".
    - _Conditional Inputs_:
      - If "Complete X Tasks": Number input.
      - If "Defeat Boss": Boss HP input.

### Logic (`src/plugin.ts`)

- **Step Transitions**:
  - When entering a step, iterate `tasksToCreate` and call `PluginAPI.addTask` (if available for "creation").
    > [!NOTE]
    > Since `addTask` might not strictly exist in the exposed API yet, we will implement the data structure now and log the intent / use available API methods or prepare for it. _Correction_: The user asked for "Creation of tasks", implying integration. I will assume we can at least signal this or use `updateTask` on the current task if strictly limited, but the reliable way is to prepare the structure. I will use `PluginAPI.addShortTask` if available or similar, or just log for now as "Ready to Spawn".

- **Task Completion Listener**:
  - When a task is completed:
    - Check current step's `completion.type`.
    - If `all_tasks`: Check if all tasks tracked for this step (need to track spawned IDs?) are done.
    - If `any_count`: increment a counter.
    - If `boss_defeat`: Apply damage logic.

## Verification

1.  **Creation Config**:
    - Add 3 tasks to a step.
    - Set completion to "Any 2".
    - Save and Reload.
2.  **Runtime**:
    - _Simulate_ task completion (since we might not fully integrate with host app task creation yet without more API exploration).
    - Verify step progresses only when 2 tasks are done.
