# Implementation Plan - Task 026

**Goal:** Implement "Rich Bosses" by allowing users to define a custom Name, Image, and Theme Color for bosses directly within the Story Step.

## ⚠️ User Review Required

> [!IMPORTANT]
> The `BossConfig` schema change will be backward compatible (optional fields), but existing bosses will default to generic names/images until updated.

## 🧠 Brain (`src/plugin.ts` & `src/types/`)

- **State Changes:** Update `BossConfig` in `src/types/state.ts` to include:
  - `name: string` (e.g., "The Procrastination Slime")
  - `image: string` (URL or emoji)
  - `themeColor: string` (Hex code for UI tint)
- **Persistence:** No special changes needed; data is stored within the `StoryStep` JSON.

## 🎨 Face (`src/app/` & SolidJS)

- **Visuals:**
  - Update `DashboardView.tsx` to display the Boss Name and Image.
  - Implement a "Character Behind" layout where the boss image looms behind/above the HP bar.
- **Components:**
  - `src/components/editor/CompletionRequirementEditor.tsx`: Add input fields for Boss Name, Image URL, and Color Picker.

## 📋 Step-by-Step Implementation

### 1. Brain (Types)

- [ ] [MODIFY] [state.ts](file:///home/deck/Projects/QuestArc/src/types/state.ts): Add `name`, `image`, `themeColor` to `BossConfig`.

### 2. Face (Editor)

- [ ] [MODIFY] [CompletionRequirementEditor.tsx](file:///home/deck/Projects/QuestArc/src/components/editor/CompletionRequirementEditor.tsx): Add form fields for new Boss properties.

### 3. Face (Dashboard)

- [ ] [MODIFY] [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx): Render the new Boss visual elements.
- [ ] [MODIFY] [App.css](file:///home/deck/Projects/QuestArc/src/App.css): Add styles for `.boss-image`, `.boss-container`, etc.

## 🧪 Verification

- **Manual:**
  1.  Create a new Story.
  2.  Add a Step with "Defeat Boss" requirement.
  3.  Set Boss Name to "King Slime", Image to a URL (or placeholder), and Theme to Green.
  4.  Save and start the Quest.
  5.  Verify the Dashboard shows "King Slime" and the image.
