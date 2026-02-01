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

**Syntax**: `⚔️ Name [HP:N]`

| Component | Syntax | Description |
| :--- | :--- | :--- |
| **Icon** | `⚔️` | **Required** to identify a Boss. |
| **HP** | `[HP:N]` | Sets Health Points. |
| **XP** | `[XP:N]` | (Optional) Sets XP reward. |

**Example**:
*   `⚔️ Shadow Bug [HP:100]`

### D. Single Tasks
Any task without special tags is a standard single-action task.

**Example**:
*   `Buy Milk`

---
## 4. Visual Indicators (Auto-Generated)

**Do not type these manually.** The game adds them to show progress.

*   `(1/5)`: Progress counter for Grinds/Habits.
*   `3/7 🔥`: Streak tracking.
