# Implementation Plan - Refactor Header UI (005)

**Goal:** Redesign the header (banner) to focus on the user's status (`Lvl` and `HP`) and add a profile image, removing the "QuestArc" text title.

## ⚠️ User Review Required
> [!NOTE]
> This change modifies the core layout of the plugin's main view.

## 🧠 Brain (`src/plugin.ts` / `src/lib/`)
* **State Changes:**
    *   Update `QuestArcState` in `src/types/state.ts` to include `hp` and `maxHp` in `profile`.
    *   Update `INITIAL_STATE` in `src/lib/state-manager.ts` to set default User HP (100/100).
* **Persistence:**
    *   State migration will implicitly handle new fields if we rely on `migrateState`, but since we are just adding fields, existing state might be missing them. We should update `migrateState` to ensure `hp` exists if missing.
* **Logic:**
    *   None explicitly requested for *changing* HP, but we must initialize it.

## 🎨 Face (`src/app/` & Assets)
* **Assets:**
    *   Create `src/assets/avatar.svg` (Simple hero icon).
* **Components:**
    *   `App.tsx`:
        *   Remove `<h1>⚔️ QuestArc</h1>`.
        *   Structure:
            ```
            <Header>
              <Avatar />
              <InfoColumn>
                <LevelText />
                <HPBar />
              </InfoColumn>
            </Header>
            ```
    *   `App.css`:
        *   Add styles for `.header-content` (flex container).
        *   Add styles for `.avatar`.
        *   Add styles for User HP Bar (Green/Health color to distinguish from Boss).
* **Visuals:**
    *   Profile Image: SVG Icon.
    *   User HP: Green gradient.

## 📋 Step-by-Step Implementation

### 1. Assets
- [ ] [NEW] `src/assets/avatar.svg`: Create a simple hero/profile SVG.

### 2. Brain (State)
- [ ] [MODIFY] `src/types/state.ts`: Add `hp`, `maxHp` to `profile`.
- [ ] [MODIFY] `src/lib/state-manager.ts`: Update `INITIAL_STATE` and `migrateState` (handle missing `hp`).

### 3. Face (UI)
- [ ] [MODIFY] `src/app/App.css`: Add styles for new header layout, avatar, and user HP bar.
- [ ] [MODIFY] `src/app/App.tsx`: Implement the new structure.

## 🧪 Verification
* **Manual:**
    *   Check if "QuestArc" title is gone.
    *   Check if Profile Image appears on the left.
    *   Check if "Lvl X" is the prominent headline.
    *   Check if User HP bar appears below Level.
    *   Verify values match state (mock/initial).
* **Automated:**
    *   `npm run typecheck` to ensure state types are correct.
