# Plan: Multi-Step "Heroic Story" Editor

## Goal
Upgrade the UI to allow users to create "Stories" — a sequence of linked habit steps where each step evolves into the next upon completion.

## User Request
The user wants a reactive interface to add multiple "Step" cards to a single Story.
- Data Structure: `plugin.js` must store multi-step stories.
- UI: Solid.js logic to manage steps signal and auto-linking `nextStepId`.
- View: `index.html` (really `App.tsx`) to render step builder loop.

## Proposed Changes

### `src/app/App.tsx`
- **Steps Management**:
  - Convert `newStep` signal to `steps` array signal.
  - Initial state: `[{ id: 1, title: '', target: 3, xp: 50 }]`.
  - Add `addStep` function to append new steps.
- **Save Logic**:
  - `saveStory` maps steps to assign `nextStepId = index < length - 1 ? index + 2 : null`.
  - Sends payload via `MESSAGE_TYPES.SAVE_STORY`.
- **UI Template**:
  - Replace single form with `<For each={steps()}>` loop.
  - Display "Story Name" input at the top level.
  - Display list of steps with Title, Streak Target inputs.
  - "Add Next Habit Step" button.

### `src/plugin.ts`
- **Verify `SAVE_STORY`**:
  - Ensure it accepts the full story object with the new steps structure. (Current implementation seems compatible, just need to verify validation logic).

## Verification
- Create a multi-step story.
- Verify in `plugin.ts` logs that the saved story has correct `nextStepId` linkages.
