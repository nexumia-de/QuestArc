# 092 - Dynamic Boss Context (Sibling Damage)

## Changes Implemented

### 1. Handler Layer (`src/handlers/TaskCompletionHandler.ts`)
*   **Context Scan**: Added logic to fetch and filter **siblings** of the completed task (same `parentId` if subtask, same `projectId` if root).
*   **Boss Detection**: improved logic to regex scan siblings for `Title [HP:N]` pattern.
*   **Dynamic Initialization**:
    *   If a Boss Sibling is found, we dynamically initialize `state.activeBoss` with its stats (Name, HP).
    *   We create a **Synthetic StoryStep** of type `boss_defeat` on the fly.
*   **Re-Running Logic**:
    *   If a dynamic boss is found, we **re-run** `processTaskCompletion` with the new Synthetic Step to ensure damage is calculated and applied to this specific boss.

### 2. Service Layer (`src/services/BossService.ts`) [NEW]
*   Extracted `scanForSiblingBoss` into a dedicated service.
*   Centralized regex for boss pattern matching.
*   Used by both `TaskCompletionHandler` and `ContextHandler`.

### 3. Handler Layer (`src/handlers/ContextHandler.ts`) [NEW]
*   New handler for proactive boss detection.
*   Triggered by `taskUpdate` and `currentTaskChange` hooks.
*   If the current task (or sibling) is a boss, updates `state.activeBoss`.
*   **HP Preservation**: If boss name matches, does NOT overwrite (prevents HP reset).

### 4. Plugin Entry (`src/plugin.ts`)
*   Registered `currentTaskChange` hook.
*   Updated `taskUpdate` hook to call `ContextHandler`.

## Verification
*   **Automated Test (TaskCompletionHandler.test.ts)**: `should DETECT sibling boss and deal damage`
    *   Setup: Worker Task + Boss Sibling Task (parentId='p1').
    *   Mocks: Quest Project `🧭` to authorize damage.
    *   Result: `activeBoss` is initialized to 'Dragon', and 'Dealt 10 damage to Dragon' snackbar is shown.
*   **Automated Test (ContextHandler.test.ts)**:
    *   `should detect Sibling Boss and set activeBoss`
    *   `should detect Self as Boss and set activeBoss`
    *   `should NOT overwrite existing boss if name is same (preserve HP)`
*   **Build Verification**: `npm run build` passes.
    *   **Optimization**: Fixed mixed static/dynamic import warning for `BossService.ts` by converting to static import in `TaskCompletionHandler.ts`.

## Impact
*   **Solves the User Issue**: "User is doing other subtasks and the boss in an active task should get damage."
*   **Proactive Display**: Boss appears on the dashboard as soon as a boss task is detected (on task switch or update), not just on completion.
*   This works implicitly for V2 Quest Projects where users structure boss fights as a list of subtasks (e.g. "Chapter 1" -> ["Dragon [HP:100]", "Attack", "Dodge"]).

