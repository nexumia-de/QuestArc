# Task 022: Task-Specific Requirements

## Goal
Moving away from generic step requirements ("Finish any 5 tasks") to **Specific Task Requirements**. 
Users should be able to mark specific created tasks/routines as **Required** and set a **Target Count** (Streak) for them.

## Proposed Changes

### 1. Data Model (`src/types/state.ts`)

#### [MODIFY] [TaskDefinition]
Add requirement fields directly to the task definition.

```typescript
export interface TaskDefinition {
  title: string;
  notes?: string;
  isAutoCreate?: boolean; // Can be false! (User must create it themselves, but it's still required)
  
  // Requirement Fields
  isRequired?: boolean;   // Does this contribute to step completion?
  requiredCount?: number; // How many times? (Default 1 for single, N for routines)
  
  // Repeat Fields (Already added in 021)
  isRepeating?: boolean;
  repeatCfg?: { ... };
}
```

#### [MODIFY] [CompletionRequirement]
Simplify the global completion config. It now effectively becomes a "Mode Selector".

```typescript
export type CompletionType = 'tasks_completed' | 'boss_defeat';

// config.count and config.all_tasks are REMOVED.
// The "Truth" is now derived from `step.tasksToCreate.filter(t => t.isRequired)`.
```

### 2. UI (`src/components/EditorView.tsx`)

#### [Updated] Task Row UI
- **Checkbox**: `[x] Required` (Default: true)
- **If Required + Repeating**: Show `Target: [ 5 ]` input.
- **If Required + Single**: Target is hidden (implied 1).

#### [Updated] Completion Section
- Simplify to a toggle: **[ Step Goal: ⚔️ Defeat Boss | ✅ Complete Tasks ]**
- If "Complete Tasks" is selected:
    - Show read-only summary: *"Requirement: Complete 'Do Pushups' (5x) and 'Read Book' (1x)."*

### 3. Logic (`src/plugin.ts`) NEEDS CAREFUL REFACTOR

**Problem:** How do we track "Did you do *Task A* 5 times?"
**Solution:** We need to map completed tasks back to their `TaskDefinition`.
- **Approach:**
    - When `taskComplete` fires, we check the task title (or ID if we could track it robustly).
    - Match `payload.task.title` === `step.tasksToCreate[i].title`.
    - If match: Increment a new state field: `state.activeStory.stepProgress[taskTitle]`.
    - Check if `stepProgress[taskTitle] >= requiredCount`.

#### [NEW] State Tracking
Update `QuestArcState.activeStory` to track progress per task.

```typescript
activeStory: {
  // ...
  taskProgress: Record<string, number>; // { "Daily Pushups": 3, "Read Book": 1 }
}
```

## Verification
1.  **Editor**: Create Routine "Gym" (Required, Target: 3).
2.  **Runtime**: Complete "Gym" task 3 times.
3.  **Result**: Step completes only after 3rd completion.
