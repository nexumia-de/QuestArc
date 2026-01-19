# Implement Project Backlog

## Goal Description
Separate the display of tasks to show **only** the "Current Task" (active focus) in the plugin dashboard. Future tasks are deferred to the Super Productivity Backlog, keeping the main view focused on the immediate next step.

## User Review Required
> [!NOTE]
> - "Current Task" is defined as the **first uncompleted task** in the list.
> - "Backlog" refers to the **Super Productivity Backlog**, not a plugin UI section.

## Proposed Changes

### Components

#### [MODIFY] [TaskService.ts](file:///home/deck/Projects/QuestArc/src/services/TaskService.ts)
- Modify `createTasksForStep` to handle backlog assignment:
    - **Current Task** (First task in step): Add to "Today" (default).
    - **Future Tasks** (Index > 0): Add to "Backlog" (set `isBacklog: true` in task payload).
    - Ensure usage of `PluginService.api.addTask` supports the backlog flag.

#### [MODIFY] [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx)
- Filter displayed tasks to show **ONLY** the current active task.
- **Logic**:
    - Identify `tasksToCreate` for the current step.
    - Find the first *uncompleted* task.
    - Render *only* that task.
    - Do not render subsequent tasks (they are in SP Backlog).
    - Do not render completed tasks (they are done/in SP history).

## Verification Plan

### Manual Verification
1.  **Start a Quest**: Create a new quest/story that has multiple tasks.
2.  **Verify Initial State**:
    - Check that only the *first* task is shown in the "Current Task" area of the Plugin Dashboard.
    - Check that the subsequent tasks appear in the **Super Productivity Backlog**.
3.  **Complete Task**:
    - Check off the current task.
    - Verify the *next* task automatically promotes to "Current Task" in the Plugin Dashboard.
    - Verify the completed task is handled according to user's standard SP workflow (e.g. moved to Done).
