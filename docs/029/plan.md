# Implementation Plan - Task 029

**Goal:** Refactor `state-manager.ts` into smaller, focused modules to improve maintainability and adherence to Single Responsibility Principle.

## ⚠️ User Review Required
> [!NOTE]
> This refactor splits `state-manager.ts` into 5 files. All imports will need to be updated or a barrel file used. I will use a barrel file to minimize diffs in other files.

## 📂 Architecture Changes

### New File Structure (`src/lib/state/`)
1.  `config.ts`: Constants and initial state configuration.
2.  `persistence.ts`: `migrateState`, `ensureState`, `createInitialState`.
3.  `validation.ts`: `validateState`.
4.  `story.ts`: `getActiveStory`, `getCurrentStep`, `getCurrentStepTitle`.
5.  `profile.ts`: `updateXp`.

### Component Responsibilities

1.  **`config.ts`**
    - `INITIAL_STATE`
    - `CURRENT_STATE_VERSION`

2.  **`persistence.ts`**
    - Handles creation, migration, and ensuring state integrity.
    - Depends on `config.ts`.

3.  **`validation.ts`**
    - Pure validation logic.

4.  **`story.ts`**
    - Helpers for retrieving story/step data from state.

5.  **`profile.ts`**
    - Logic for XP, Leveling, and Pet Evolution.

6.  **`state-manager.ts`** (Barrel File)
    - Re-exports everything from `src/lib/state/*.ts`.

## 📋 Step-by-Step Implementation

### 1. Create Directory
- [ ] [NEW] `src/lib/state/`

### 2. Create Modules
- [ ] [NEW] `src/lib/state/config.ts`: Move constants and initial state.
- [ ] [NEW] `src/lib/state/persistence.ts`: Move `createInitialState`, `migrateState`, `ensureState`.
- [ ] [NEW] `src/lib/state/validation.ts`: Move `validateState`.
- [ ] [NEW] `src/lib/state/story.ts`: Move `getActiveStory`, `getCurrentStep`, `getCurrentStepTitle`.
- [ ] [NEW] `src/lib/state/profile.ts`: Move `updateXp`.

### 3. Update Barrel File
- [ ] [MODIFY] `src/lib/state-manager.ts`: Replace content with exports.

## 🧪 Verification
- [ ] **Automated:** `npm run typecheck`
- [ ] **Manual:** Run standard regression tests (load, save, complete task).
