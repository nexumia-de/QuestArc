# Implementation Plan - Task 038

**Goal:** Clear the dashboard after quest completion so that no quest is shown effectively resetting the view until a new quest is started.

## ⚠️ User Review Required
> [!NOTE]
> This change allows `activeStory.id` to be `null` in the state. This represents a state where no quest is currently active.

## 🧠 Brain (`src/plugin.ts`)
* **State Changes:** `QuestArcState.activeStory.id` will now be `string | null`.
* **Logic:**
    *   `MessageHandler` will set `activeStory.id` to `null` on `ACKNOWLEDGE_COMPLETION`.
    *   State helpers (`getCurrentStep`, `getCurrentStepTitle`) need to handle null ID gracefully.

## 🎨 Face (`src/app/` & SolidJS)
* **Components:**
    *   `DashboardView.tsx` needs to conditionally render the "Current Story Step" section only if there is an active story.
    *   If no active story, show a "Start your adventure" or similar empty state (or just the actions).

## 📋 Step-by-Step Implementation

### 1. Types & State Logic
- [ ] [MODIFY] `src/types/state.ts`: Update `QuestArcState` to allow `activeStory.id: string | null`.
- [ ] [MODIFY] `src/handlers/MessageHandler.ts`: Update `ACKNOWLEDGE_COMPLETION` to set `id` to `null`.
- [ ] [MODIFY] `src/lib/state/story.ts`: Ensure `getCurrentStepTitle` handles null ID.

### 2. UI Updates
- [ ] [MODIFY] `src/components/DashboardView.tsx`: Wrap content in `<Show when={hasActiveStory()}>`.
- [ ] [MODIFY] `src/app/App.tsx`: Update `handleAcknowledgeCompletion` optimistic update to set `id` to `null`.
 

## 🧪 Verification
* **Automated:** `npm run typecheck`, `npm run lint`
* **Manual:**
    1.  Complete a quest (or simulate completion).
    2.  Click "Continue Adventure" in the popup.
    3.  Verify that the dashboard clears and does not show the last step.
    4.  Verify that "New Quest" / "My Quests" buttons are still visible and functional.
