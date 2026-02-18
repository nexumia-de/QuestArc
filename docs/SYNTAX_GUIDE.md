yn

This guide explains how to create **Stories** using standard Projects and Tasks, and defines the syntax for special game elements.

---

## 1. Story Templates (The "Source")

In QuestArc, a **Story** is simply a **Project**. To define a reusable Story (a template), you create a Project with specific markers.

### Creating a Template
1.  **Create a Project**:
    *   Set the **Icon** to **Bow** (🏹).
    *   Start the **Title** with **Scroll** (`📜`) (e.g., `📜 Morning Routine`).
2.  **Detection**: The game scans for projects with the `🏹` icon and classifies them based on their Title Prefix.

### Playing a Story
*   **Start**: When you "Start" a story from the dashboard, the game creates a **New Project** based on your Template.
*   **Pause/Delete**: You can pause or delete the active story project directly.

---

## 2. Steps & Requirements (Tasks)

The structure of your Story Project defines the game flow.

*   **Step** = **Task**: Every top-level Task in your Project is a "Step" in the Story.
*   **Requirement** = **Subtask**: Subtasks under a Step are the specific requirements needed to complete that Step.

**Example Structure:**
*   Project: *Morning Routine* (📄)
    *   Task 1: *Wake Up Protocol* (Step 1)
        *   Subtask: *Drink Water*
        *   Subtask: *Stretch*
    *   Task 2: *Deep Work* (Step 2)

---

## 3. Element Syntax

You define special game behaviors (Habits, Bosses, Grinds) by writing **Tags** in the **Task Title**. 

**Note**: Do not edit JSON files. All configuration happens in the Task/Project titles.

### A. Habits (Recurring)
Tasks that repeat on a schedule.

**Syntax**: `[freq:<FREQUENCY>]`

| Component | Syntax | Description | Required? |
| :--- | :--- | :--- | :--- |
| **Frequency** | `[freq:daily]` | Repeats every day. | ✅ Yes |
| | `[freq:weekly]` | Repeats every week (Monday). | |
| | `[freq:CRON]` | Custom schedule (e.g., `[freq:5 4 * * *]`). | |
| **Count** | `[count:N]` | Requires `N` completions per period. | ❌ No |
| **Streak** | `[streak:N]` | Sets a target streak goal. | ❌ No |

**Examples**:
*   `Drink Water [freq:daily]`
*   `Gym [freq:weekly] [count:3]`

### B. Grinds (Counters)
One-off tasks that require multiple actions to complete.

**Syntax**: `[count:N]` (without `[freq]`)

| Component | Syntax | Description | Required? |
| :--- | :--- | :--- | :--- |
| **Count** | `[count:N]` | Requires `N` total completions. | ✅ Yes |

**Examples**:
*   `Pushups [count:50]`
*   `Read Pages [count:100]`

### C. Bosses (Enemies)
Add a Boss battle to a Step.

**Syntax**: `Name [HP:N]`

| Component | Syntax | Description |
| :--- | :--- | :--- |
| **HP** | `[HP:N]` | Sets Health Points. |
| **XP** | `[XP:N]` | (Optional) Sets XP reward. |

**Example**:
*   `Shadow Bug [HP:100]`

### D. Single Tasks
Any task without special tags is a standard single-action task.

**Example**:
*   `Buy Milk`

### E. Persistence (Challenges)
Tasks in a Story can be marked to become persistent Habits in your **Grimoire** upon completion (e.g., "Run 5km [count:3]" becomes "Run 5km" in your permanent habits).

**Syntax**: `[persistent:Group]` (Group is Optional)

| Component | Syntax | Description |
| :--- | :--- | :--- |
| **Persistence** | `[persistent]` | Default. Moves task to **Inbox** in Grimoire. |
| | `[persistent:Morning]` | Moves task to **Morning** group in Grimoire. |

**Examples**:
*   `Run 5km [freq:weekly] [count:3] [persistent:Health]` -> Moves to "Health" group after 3 runs.
*   `Read Book [freq:daily] [count:7] [persistent]` -> Moves to "Inbox" after 7 days.

### F. Habit Stacking (Cross-Step Continuity)
Habits can carry their streak across quest steps using the `[stack]` tag. When a step completes, the habit is cloned into the next step with its streak history intact but the new step's goal.

**Syntax**: `[stack:ID]`

| Component | Syntax | Description |
| :--- | :--- | :--- |
| **Stack ID** | `[stack:walk]` | Unique chain identifier. Habits with the same ID across steps are linked. |

**What carries over**: `streak.current`, `streak.highest`, `streak.tier`, `streak.totalCompletions`, `streak.availableGrace`, `progress.lastDoneDate`

**What resets**: `progress.current` (daily goal), `streak.target` (from new step's `[streak:N]`), task title (from new step)

**Example** (escalating difficulty across steps):
```
📜 Build a Walking Habit
├── Step 1: "Baby Steps"
│   └── Walk 5 min [freq:daily] [streak:3] [persistent:Fitness] [stack:walk]
├── Step 2: "Building Up"
│   └── Walk 10 min [freq:daily] [streak:7] [persistent:Fitness] [stack:walk]
└── Step 3: "Making It Stick"
    └── Walk 15 min [freq:daily] [streak:14] [persistent:Fitness] [stack:walk]
```

> **Note**: `[stack:ID]` and `[persistent:Group]` are independent. `[stack]` handles mid-quest continuity; `[persistent]` handles post-quest Grimoire graduation.
>
> **Best Practice**: Only add the `[persistent]` tag to the **last step** of your habit chain. If you add it to every step, you will generate a new Grimoire habit for each variation (e.g., "Walk 5 min" AND "Walk 10 min").

---
## 4. Visual Indicators (Auto-Generated)

**Do not type these manually.** The game adds them to show progress.

*   `(1/5)`: Progress counter for Grinds/Habits.
*   `3/7 🔥`: Streak tracking.
