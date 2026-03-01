# Implementation Plan - Task 024

**Goal:** Address code review feedback by fixing critical type definitions, implementing state migration for `taskProgress`, and improving task completion logic.

## ⚠️ User Review Required

> [!IMPORTANT]
> The `streakProgress` field is being deprecated in favor of `taskProgress`. This is a non-breaking change as migration logic will be added, but developer awareness is required.

## 🧠 Brain (`src/plugin.ts`)

- **State Changes:**
  - `ActiveStory`: Remove `streakProgress`, add `taskProgress: Record<string, number>`.
- **Logic:**
  - **Migration**: Ensure `taskProgress` is initialized for existing states in `ensureState`.
  - **Matching**: Improve task matching robustness where possible (investigating `tagIds` or IDs). For now, strict title matching will be maintained but documented variables will be cleaned up.
  - **Initialization**: Add logic to `init()` or `Start` to auto-create tasks for the very first step of a story.

## 🎨 Face (`src/app/` & SolidJS)

- **Types**: Update shared type definitions in `src/types/state.ts` to match the Brain.

## 📋 Step-by-Step Implementation

### 1. Types & State Logic

- [ ] [MODIFY] `src/types/state.ts`: Add `taskProgress`, remove `streakProgress`.
- [ ] [MODIFY] `src/lib/state-manager.ts`: Update `ensureState` to initialize `taskProgress` if missing. Update `migrateState` if necessary.

### 2. Game Logic

- [ ] [MODIFY] `src/lib/game-logic.ts`: Remove `streakProgress` references. Ensure `processTaskCompletion` uses `taskProgress` safely.

### 3. Plugin Initialization

- [ ] [MODIFY] `src/plugin.ts`: Add logic to trigger task creation when a story is first activated or if tasks for the current step are missing.

### 4. Documentation

- [ ] [DELETE] `docs/023` (Not deleting, but ensuring it is clean).

## 🧪 Verification

- **Automated**: `npm run build` (Type check).
- **Manual**:
  - Load extension with existing state -> Check console for migration logs.
  - Start new story -> Verify tasks are created.
  - Complete task -> Verify `taskProgress` updates.
  - Verify `streakProgress` is gone from state.
