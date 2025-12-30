# Implementation Plan - Task 004

**Goal:** Implement UI improvements identified during the review to meet mobile usability standards and enhance visual polish.

## ⚠️ User Review Required
> [!IMPORTANT]
> This plan proposes strictly visual and interaction changes. No game logic (Brain) is affected.

## 🧠 Brain (`src/plugin.ts`)
* **State Changes:** None.
* **Persistence:** None.
* **Logic:** None.

## 🎨 Face (`src/app/` & SolidJS)
* **Visuals:**
    *   Add gradients to XP/HP bars for a modern look.
    *   Increase "Reset Progress" button size to meet touch targets (min 44px).
    *   Add subtle border/glow to cards.
* **Components:**
    *   `App.css`: Update `.xp-bar-fill`, `.hp-bar-fill`, `.reset-btn`, `.step-card`.
    *   `App.tsx`: Remove `window.confirm` in favor of a better pattern (or a custom modal if time permits, but starting with styling).
* **Protocol:** None.

## 📋 Step-by-Step Implementation

### 1. Face (UI)
- [ ] [MODIFY] `src/app/App.css`: Implement gradients and increase button touch targets.
- [ ] [MODIFY] `src/app/App.css`: Add premium visual effects (borders, shadows).
- [ ] [MODIFY] `src/app/App.tsx`: Replace `window.confirm` with a custom interaction or modal.

## 🧪 Verification
* **Automated:** `npm run typecheck`
* **Mobile/Background:** Verify buttons are easily clickable on small screens.
* **Visual:**
    *   Progress bars should have a smooth left-to-right gradient.
    *   Reset button should be tall and easy to tap.
