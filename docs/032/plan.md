# Plan: Quest Completion Animation

## Goal
Display a "Finish Animation" (e.g., confetti, success message) when the user completes the final step of a quest.

## Proposed Changes

### 1. State Update (`src/types/state.ts`)
- Add `isCompleted?: boolean` to the `activeStory` object in `QuestArcState`.

### 2. Logic Update (`src/handlers/TaskCompletionHandler.ts`)
- In `TaskCompletionHandler.handle`:
  - When a step is completed (`stepCompleted` is true):
    - Check if `currentStep.nextStepId` is null/undefined.
    - If it is, set `newState.activeStory.isCompleted = true`.

### 3. Logic Update (`src/handlers/MessageHandler.ts`)
- In `START_QUEST` handler:
  - Ensure `isCompleted` is reset to `false` (or undefined) when a new quest starts.

### 4. UI Update (`src/components/DashboardView.tsx`)
- Add a conditional check for `props.state.activeStory.isCompleted`.
- If true, display a "Quest Complete!" overlay/animation.
- We can use a simple CSS animation or aconfetti library if available (but prefer CSS for simplicity per "Vanilla CSS" rule).

## Verification Plan
1.  **Manual Test**:
    - Create a short 2-step story.
    - Complete Step 1 -> Verify move to Step 2.
    - Complete Step 2 -> Verify "Finish Animation" appears.
    - Start a new quest -> Verify animation clears.
