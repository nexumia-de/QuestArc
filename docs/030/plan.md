# Implementation Plan - Task 030

**Goal:** Refactor `App.tsx` by extracting messaging logic, state synchronization, and navigation into reusable hooks and services.

## ⚠️ User Review Required

> [!NOTE]
> This refactor will not change functionality but will significantly reduce line count in `App.tsx`.
> I will specifically fix the `streakProgress` lint error during this refactor.

## 📂 Architecture Changes

### New File Structure

- `src/services/`
  - `MessageService.ts`: `sendMessage` - Typed wrapper around `postMessage`.
- `src/hooks/`
  - `useStateSync.ts`: Encapsulates `hasStateChanged`, initial sync, and polling interval.
  - `useNavigation.ts`: Encapsulates `view`, `editingStory`, and navigation functions.

### Component Responsibilities

1.  **`MessageService.ts`**
    - Handles low-level `postMessage` promise wrapping.
    - Types response payloads.

2.  **`useStateSync.ts`**
    - Manages the local `state` signal.
    - Handles the polling loop.
    - Contains the `hasStateChanged` deep comparison logic.
    - **Fix:** Update `hasStateChanged` to remove `streakProgress` check as it was removed from the type definition.

3.  **`useNavigation.ts`**
    - Manages `view` state.
    - Manages `editingStory` state for the editor.
    - Exports formatted actions: `goToDashboard`, `goToEditor`, `goToStoryList`.

4.  **`App.tsx`** (Main Entry)
    - Composes hooks.
    - Renders the main shell (Header, View content, Footer).
    - Handles the "Reset" confirmation logic (can remain locally or move to a separate component if complex, but currently 10 lines so okay).
    - Handles "Save Story" logic (could be in `useStoryActions` hook, but fine to keep in App for now using `MessageService`).

## 📋 Step-by-Step Implementation

### 1. Extract Services

- [ ] [NEW] `src/services/MessageService.ts`: Move `sendMessage` logic here.

### 2. Extract Hooks

- [ ] [NEW] `src/hooks/useStateSync.ts`: Move polling and state diffing logic here. **Fix streakProgress error.**
- [ ] [NEW] `src/hooks/useNavigation.ts`: Move view and editing state logic here.

### 3. Refactor App.tsx

- [ ] [MODIFY] `src/App.tsx`: Refactor to use new hooks and services.

## 🧪 Verification

- [ ] **Automated:** `npm run typecheck` (Should finally pass!).
- [ ] **Manual:**
  - Verify loading screen.
  - Verify Dashboard shows up.
  - Verify Navigation between tabs.
  - Verify Reset button works.
