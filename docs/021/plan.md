# Task 021: Repeat Task Integration

## Goal
Enable users to define **Repeating Tasks** (Routines) within the Story Editor. When a step with a repeating task starts, the plugin should tell Super Productivity to create a task with the specified repeat configuration (e.g., Daily, Weekly).

## User Review Required
> [!IMPORTANT]
> **Assumption:** `PluginAPI.addTask` accepts an `additionalFields` object where we can pass `repeatCfg`.
> Based on Super Productivity's internal structure (seen in similar plugins/docs), `taskRepeatCfg` is the standard field.
> If the API doesn't support this directly, we might need to find a workaround or update the host API logic (if we had control, which we don't). We will proceed assuming we can pass the data.

## Proposed Changes

### Data Model (`src/types/state.ts`)

#### [MODIFY] [state.ts](file:///home/deck/Projects/QuestArc/src/types/state.ts)
- Update `TaskDefinition` to include `repeatCfg`.

```typescript
export interface TaskDefinition {
  title: string;
  notes?: string;
  isAutoCreate?: boolean;
  
  // New Fields for Repeat
  isRepeating?: boolean;
  repeatCfg?: {
    repeatEvery: number;
    repeatType: 'DAILY' | 'WEEKLY' | 'MONTHLY'; // Simplified subset of Super Productivity types
    startDate?: string;
  };
}
```

### UI Components (`src/components/EditorView.tsx`)

#### [MODIFY] [EditorView.tsx](file:///home/deck/Projects/QuestArc/src/components/EditorView.tsx)
- Update **Task Row** in "Tasks to Create":
    - Add a "🔁" (Repeat) toggle button.
    - If enabled, show a sub-panel (similar to the user's screenshot, but simplified):
        - Dropdown: "Every Day", "Every Week".
        - (Optional) Start Time.
- **Completion Requirements Impact**:
    - If a task is repeating, the completion requirement for the step typically becomes "Streak" or "Count".
    - *UX Improvement*: If user adds a repeating task, hint that "Any Count" is the best completion type.

### Logic (`src/plugin.ts`)

#### [MODIFY] [plugin.ts](file:///home/deck/Projects/QuestArc/src/plugin.ts)
- Update `createTasksForStep`:
    - Check if `taskDef.isRepeating` is true.
    - Construct `additionalFields` with `taskRepeatCfg`.
    - Call `PluginAPI.addTask(title, additionalFields)`.

```typescript
// Example payload construction
const additionalFields = {
  notes: taskDef.notes,
  taskRepeatCfg: taskDef.isRepeating ? {
    repeatEvery: 1, // Default or config
    repeatCycle: taskDef.repeatCfg?.repeatType || 'DAILY',
    startDate: getTodayStr(),
  } : undefined
};
```

## Verification
1.  **Editor**: Create a step with a "Daily Habit".
2.  **Runtime**: Start the story.
3.  **Check**: Verify `addTask` is called with the correct `taskRepeatCfg`.
    - *Note*: We cannot easily verify the host app *actually* created a repeat task without seeing the host UI, but we can verify the API call parameters via logs.
