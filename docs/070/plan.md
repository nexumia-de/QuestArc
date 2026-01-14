# Phase 4: Content Expansion Plan

## Goal
To implement the full "Productivity Mastery" main quest and enhance the Boss battle experience. This transforms the technical framework (Phases 1-3) into a playable game.

## User Review Required
> [!IMPORTANT]
> This phase establishes the default content that all new users will see.

## Proposed Changes

### 1. Story Implementation (`src/lib/persistence.ts`)
*   **[MODIFY]** `DEFAULT_STATE`:
    *   Replace the placeholder "Tutorial Story" with the full "Productivity Mastery" quest.
    *   **Structure**:
        *   **Chapter 1: The Awakening**: Setup tasks (Set Goals, Create Tags). Boss: "Procrastination Demon" (HP: 50).
        *   **Chapter 2: The Grind**: Grind tasks (Pushups, Reading). Boss: "Entropy Golem" (HP: 100).
        *   **Chapter 3: Mastery**: Complex habits. Boss: "Shadow Self" (HP: 200).

### 2. Boss Mechanics & Visuals
*   **[MODIFY]** `src/types/state.ts`:
    *   Ensure `Boss` interface supports `image` (URL/Asset path) and `modifiers` (Weakness to tags).
*   **[MODIFY]** `QuestDashboard.tsx`:
    *   Display Boss Image (if active).
    *   Show Boss Health Bar (Animated?).
    *   Show "Weakness" hints (e.g., "Weak to #focus tasks").

### 3. Verification Plan
*   **Manual**: Start a fresh save (clear localStorage) and verify the "Productivity Mastery" story loads.
*   **Manual**: progress through Chapter 1 to spawn the first boss.
