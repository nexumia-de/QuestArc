# Profile Editor & Modular Avatar Customization

## Goal Description

Implement a comprehensive Avatar Customization system. Users can click their avatar in the Hero View (`CharacterView`) to enter an "Edit Mode", where they can customize their hero's appearance (Skin, Eyes, Mouth, etc.).

## User Review Required

> [!NOTE]
> This requires a migration of the `QuestArcState` to include `profile.avatar` configuration. Default values will be provided for existing users.

## Proposed Changes

### Data Model

#### [MODIFY] [state.ts](file:///home/deck/Projects/QuestArc/src/types/state.ts)

- Add `AvatarConfig` interface:
  ```typescript
  export interface AvatarConfig {
    skinColor: string;
    bgColor: string; // Background gradient base
    eyes: "neutral" | "happy" | "tired" | "focus";
    mouth: "neutral" | "smile" | "frown" | "surprised";
    // Potential for accessories or hair later
  }
  ```
- Update `QuestArcState.profile` to include `avatar: AvatarConfig`.

### Components

#### [MODIFY] [Avatar.tsx](file:///home/deck/Projects/QuestArc/src/components/Avatar.tsx)

- Update `AvatarProps` to accept `config: AvatarConfig`.
- Implement visual variations for Eyes and Mouths using SVG paths.
- Use `config.skinColor` and `config.bgColor` for dynamic styling.

#### [MODIFY] [CharacterView.tsx](file:///home/deck/Projects/QuestArc/src/components/CharacterView.tsx)

- Add local state `isEditing` (boolean).
- **View Mode**:
  - Avatar is clickable (`cursor: pointer`).
  - onClick -> sets `isEditing(true)`.
  - Display current stats as usual.
- **Edit Mode**:
  - Show `AvatarEditor` controls below the avatar.
  - Controls:
    - **Skin**: Color picker or preset palette.
    - **Background**: Color picker or preset palette.
    - **Eyes**: Icon grid or select dropdown.
    - **Mouth**: Icon grid or select dropdown.
  - Actions: "Save Changes" (Persist to State), "Cancel" (Revert).

#### [MODIFY] [Header.tsx](file:///home/deck/Projects/QuestArc/src/components/Header.tsx)

- Receive full `profile` (including new `avatar` config).
- Pass config to the small `Avatar` instance in the HUD.

### Services

#### [MODIFY] [plugin.ts](file:///home/deck/Projects/QuestArc/src/plugin.ts)

- Handle state migration: ensure `avatar` object exists on load.
- Add/Update message handler for `UPDATE_PROFILE` to save changes.

## Verification Plan

### Automated Tests

- `npm run build`: Ensure strict type compliance.

### Manual Verification

1.  **Interaction**: Click Avatar in Hero view -> Editor opens.
2.  **Live Preview**: Changing options updates the Avatar immediately in the editor.
3.  **Persistence**: Save -> Reload App -> Avatar remains customized.
4.  **HUD Sync**: Header avatar matches the Hero view avatar.
