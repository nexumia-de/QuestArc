# 008 - Implement "Pet" & "Avatar" Data Model

## Goal Description

Expand the user profile to support pet evolution and avatar customization. This involves adding a `pet` object to the profile state, implementing "growth" logic based on user level, and adding necessary CSS classes for visual representation.

## User Review Required

No breaking changes.

## Proposed Changes

### Core Logic (`src/types/state.ts`)

#### [MODIFY] [state.ts](src/types/state.ts)

- Update `QuestArcState.profile` to include:
  ```typescript
  pet: {
    type: string; // e.g., 'slime'
    stage: number; // 1 (Egg), 2 (Baby), 3 (Adult)
    name: string;
  }
  ```

### Brain (`src/plugin.ts`)

#### [MODIFY] [plugin.ts](src/plugin.ts)

- Update initialization logic to include default pet: `{ type: 'slime', stage: 1, name: 'Buddy' }`.
- Update `checkLevelUp` logic:
  - Inside the level-up block, check if `newLevel % 5 === 0`.
  - If true, increment `pet.stage`.
  - Clamp `pet.stage` if necessary.

### Visuals (`src/app/App.css`)

#### [MODIFY] [App.css](src/app/App.css)

- Add classes:
  - `.pet-egg`: Visual style (e.g., smaller, rounded).
  - `.pet-baby`: Visual style (medium).
  - `.pet-adult`: Visual style (large).

### UI (`src/app/App.tsx`)

#### [MODIFY] [App.tsx](src/app/App.tsx)

- Render the pet in the UI (likely near the avatar).
- Apply the appropriate class based on `pet.stage`.

## Verification Plan

### Manual Verification

1.  **Initialization**:
    - Reset progress.
    - Verify `pet` appears in state (console log or UI).
    - Verify pet starts at stage 1 (Egg).
2.  **Evolution**:
    - Manually set level to 4 (via DevTools or code hack).
    - Gain XP to reach level 5.
    - Verify `pet.stage` becomes 2.
    - Verify UI updates to "Baby".
    - Repeat for level 10 -> Adult.
