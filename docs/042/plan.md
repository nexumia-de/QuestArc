# Plan: App Navigation Overhaul

## Goal

Implement a main tab bar navigation at the bottom of the screen to improve accessibility and organize core features.

## Architecture

### 1. New Components

- `components/NavBar.tsx`: A persistent footer component containing the navigation tabs.
- `components/CharacterView.tsx`: A new view for detailed character stats and pet interaction.
- `components/InventoryView.tsx`: A placeholder view for the future inventory system.

### 2. Tab Navigation

The app will now support 4 main tabs:

1.  **Quests** (🏠): The main dashboard (Active Quest + Tasks) AND Story List.
2.  **Character** (👤): Detailed hero profile (moving some stats from Header?).
3.  **Inventory** (🎒): New empty view.
4.  **Settings** (⚙️): The existing settings view.

### 3. State Changes

- Update `AppView` type in `useNavigation.ts` to include: `'character'`, `'inventory'`.
- Note: `'dashboard'` and `'story-list'` might technically both fall under the "Quests" tab context, but we can keep them as distinct views for now managed by the content area.

### Header Strategy: "HUD vs. Character Sheet"

- **The Conflict:** You are right. Seeing your status (HP/XP) immediately is crucial for the game loop.
- **The Resolution (Hybrid Approach):**
  - **Dashboard Header (The HUD):** Keep it! But make it focused on _Status_.
    - Shows: HP Bar, XP Bar, Level, Mini-Avatar/Pet Icon.
    - Role: "How am I doing right now?"
  - **Character Tab (The Sheet):**
    - Shows: Large Avatar/Pet Art, lore details, "Equip" slots (future), Color customization.
    - Role: "Who am I? How do I look?"

### Footer Navigation (The 4 Tabs)

1.  **Quests (⚔️):**
    - **View:** The active gameplay loop.
    - **Content:** The Header (HUD) + Active Quest Steps OR Story List (if no active quest).
2.  **Character (👤):**
    - **View:** Detailed Profile.
    - **Content:** Large artwork, Rename Pet, View detailed level stats, Change Theme.
3.  **Inventory (🎒):**
    - **View:** Grid of items.
    - **Content (MVP):** "Potions" (Buy with XP? Or just free daily?).
    - _Alternative MVP:_ Just a "Toll" or "Log" if we don't have items yet.
4.  **Settings (⚙️):**
    - **View:** System options.
    - **Content:** Reset Game, Import/Export, Debug.

## Implementation Steps

1.  **NavBar:** Create `components/NavBar.tsx` with the 4 icons.
2.  **Layout:** Update `App.tsx` to show NavBar at the bottom.
3.  **Views:**
    - **Quests:** Existing `DashboardView` + `StoryListView`.
    - **Character:** New `CharacterView.tsx` (Use `components/Header.tsx` code as a base for the art, but make it bigger).
    - **Inventory:** New `InventoryView.tsx` (Placeholder: "Your bag is empty").
    - **Settings:** Existing `SettingsView.tsx`.
4.  **Header Refinement:** Ensure `Header.tsx` looks good as a "compact" top bar on the Quests tab.
