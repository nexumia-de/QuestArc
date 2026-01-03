# Plan: Allow No Active Story (034)

## Goal
Allow users to have no active quest running. Update the Dashboard to handle this "Empty State" and provide a way to "Stop" or "Leave" a quest.

## Proposed Changes

### 1. State Update (`src/types/state.ts`)
- Update `activeStory` to be `... | null`.

### 2. Logic Update (`src/lib/state/persistence.ts`)
- Update `ensureState` to *not* force a default `activeStory` if one doesn't exist?
    - **Wait**: For new users, we probably still want to start them with "Productivity Mastery".
    - **Better**: Keep `ensureState` defaults for now so new users get an onboarding quest. But allow `activeStory` to be set to `null` manually later.
    - **Correction**: `ensureState` runs on load. If I set it to `null` and save, `ensureState` might re-populate it on next load if I'm not careful.
    - **Fix**: Change `ensureState` to only populate `activeStory` if `!newState.activeStory` AND `!newState.stories`. Or just change `ensureState` to NOT force it. If it's missing, it's missing. (Maybe init with null is better, but let's see).
    - **Decision**: I'll remove the forced `activeStory` creation in `ensureState`. If it's null, it's null. For `createInitialState`, I can optionally start with one or null. I'll stick to: `ensureState` does NOT force `activeStory`.

### 3. Logic Update (`src/handlers/MessageHandler.ts`, `src/types/messages.ts`)
- Add `STOP_QUEST` message type.
- Handle `STOP_QUEST`: Set `activeStory` to `null`, clear `activeBoss`.

### 4. UI Update (`src/components/DashboardView.tsx`)
- Handle `props.state.activeStory` being null.
- If null: Show "No Active Quest" message + "Start New Quest" button.

### 5. UI Update (`src/app/App.tsx`)
- Pass `activeStory={state().activeStory ?? null}`?
- Add `handleStopQuest` function. passed to `DashboardView`.

## Verification Plan
1.  **Manual Test**:
    - Start app -> Active story exists.
    - Click "Stop Quest" (need to add button for this).
    - Verify Dashboard shows "No Active Quest".
    - Reload app -> Verify "No Active Quest" persists (checking `ensureState` didn't overwrite it).
    - Start a quest -> Verify Dashboard returns.
