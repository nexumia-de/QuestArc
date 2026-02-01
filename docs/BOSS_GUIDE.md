# Boss Creation Guide 👹

This guide explains how to define and implement Bosses in QuestArc.

## 1. The Data Model

Bosses are defined using **Task Syntax** in your Story Template.

## 2. Defining a Boss in a Story

To add a boss to a quest, simply create a task (Step) with the specific Boss Syntax.

### Syntax
`⚔️ [Boss Name] [HP:N]`

**Example:**
*   `⚔️ Shadow Bug [HP:100]`

## 3. Boss Lifecycle (When do they appear?)

Bosses are **Step-Bound Elements**. They are not global enemies that persist for the entire project.

1.  **Spawn**: A Boss "appears" only when its specific **Story Step** becomes the **Active Step**.
2.  **Combat**: You interact with the boss while that step is active.
3.  **Death/Despawn**: Once the step is completed (Boss defeated), the boss disappears, and you move to the next step.

> **Note**: If you have multiple bosses in a Story, they will appear sequentially as you progress through their respective steps.

## 4. How It Works


1.  **Spawn**: When the player reaches the step, the game logic detects the `⚔️` icon.
2.  **Activation**: The Boss is initialized with the specified HP.
3.  **Combat**:
    *   Completing tasks normally deals **10 Base Damage**.
    *   Critical hits and modifiers (defined in internal configs for now) can increase damage.
4.  **Victory**: When `hp <= 0`, the boss is defeated and the step completes.

## 4. Checklist for Adding a Boss

- [ ] Choose the Story Step where the boss appears.
- [ ] Set the Task Title to start with `⚔️`.
- [ ] Add the `[HP:N]` tag.
