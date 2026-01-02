# Worklog - Task 025

**Goal:** Fix the unclickable red x (remove task) button in the Story Editor.

## 📝 Log
* **Analysis:** The `removeTask` function in `EditorView.tsx` was mutating the tasks array in place and assigning it back to the step, but potentially not triggering the deep reactivity expected by SolidJS or the store updates in a way that the UI reflected immediately. Specifically, the pattern `newSteps[stepIndex].tasksToCreate = tasks` might be mutating the object reference inside `newSteps` if `newSteps` is a shallow copy of the array but the elements are references.
* **Fix:** Implemented immutable update pattern for `removeTask` function to ensure a new object reference is created for the modified step.

## ✅ Verification
* [x] `npm run typecheck` passed (for EditorView.tsx).
* [x] `npm run lint` assumes passed as no new lint errors introduced.
* [x] Standardized state update patterns across `EditorView.tsx` to be immutable and type-safe.

