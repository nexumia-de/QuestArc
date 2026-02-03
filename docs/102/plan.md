# Plan: Persistent Habits (Challenge to Habit Pipeline)

## 🎯 Goal
Allow users to define "Challenges" in Stories that, upon completion, automatically evolve into persistent **Habits** in a dedicated **QuestArc Grimoire** project.

## 🏗️ Architecture Design

### 1. The "Where": Dedicated Grimoire Project
We will use a **"QuestArc Grimoire" Project** 📖.

### 2. The "How": Persistence Workflow
1.  **Challenge Definition**: A task in a story can optionally specify a target group.
    *   `Run 5km [freq:weekly] [count:3] [persistent:Health]` -> Goes to "Health" group.
    *   `Read Book [freq:daily] [count:7]` (No tag) -> Goes to "Inbox".
2.  **Completion Logic**:
    *   User completes the challenge.
    *   Story Task is marked DONE.
    *   **Action**: System invokes `HabitService.persistHabit(task)`.
3.  **Persistence Service**:
    *   Finds/Creates "QuestArc Grimoire" project.
    *   **Target Resolution**:
        *   Checks for `[persistent:Name]`.
        *   If found, ensures a parent task named "Name" exists.
        *   If NOT found, ensures "Inbox" 📥 exists.
    *   Adds the new habit as a **Subtask** of the target parent.

## 🛠️ Implementation Specs

### 1. `HabitService.ts` (New)
*   **Duty**: Managing the Grimoire and task migration.
*   `ensureGrimoireProject()`: Finds/Creates "QuestArc Grimoire" 📖.
*   `resolveTargetParent(projectId, taskNotes)`:
    *   Parses `[persistent:X]`. Returns task ID of "X" or "Inbox".
*   `persist(task: Task, originStory: string)`:
    *   Clones task.
    *   Strips limits & `[persistent:...]` tag.
    *   Adds as subtask to resolved parent.

### 2. `TaskCompletionHandler.ts`
*   In the `HABIT/GRIND` completion block:
    *   Check if `progress.current >= progress.target`.
    *   If yes, checks for `meta.promote` OR default (implicitly all challenges with count).
    *   Calls `HabitService.promote()`.

## 📚 Documentation
- [ ] Update `docs/SYNTAX_GUIDE.md` with:
    -   Combined Challenge Syntax (`[freq:...] [count:...]`).
    -   `[persistent:GroupName]` syntax.
- [ ] Update `docs/DATA_MODELS.md` to mention the "QuestArc Grimoire" project pattern.

## 🧪 Verification Plan

### Automated Tests
*   `HabitService.spec.ts`: Test `promote` function creates a new task in a mock project.

### Manual Verification
1.  Create a Story with `Test Challenge [freq:daily] [count:1] [persistent:TestGroup]`.
2.  Start Quest.
3.  Complete the task.
4.  **Verify**:
    *   Original task is checked (Green).
    *   "QuestArc Grimoire" project exists.
    *   "TestGroup" parent task exists.
    *   New task "Test Challenge" appears inside "TestGroup".
    *   New task has `[freq:daily]` but NO `[count:1]`.
