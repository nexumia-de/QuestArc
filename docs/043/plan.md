# Refactor Header & Modular SVG Avatar

## Goal Description
Transform the static Header into a dynamic gaming HUD and replace the raster avatar with a lightweight, modular SVG system. This improves aesthetics (gradients, glow) and performance (SVG < 100KB) while removing the legacy settings button.

## User Review Required
> [!IMPORTANT]
> The **Settings button** will be removed from the Header, assuming a Bottom Navigation now handles settings access.

## Proposed Changes

### Components

#### [MODIFY] [Header.tsx](file:///home/deck/Projects/QuestArc/src/components/Header.tsx)
- Remove Settings button (already absent in code, but ensure no residuals).
- Replace `img` avatar with new `Avatar` component.
- Pass `profile.pet` details to `Avatar` for Egg overlay.
- Apply new CSS classes for HUD style.

#### [NEW] [Avatar.tsx](file:///home/deck/Projects/QuestArc/src/components/Avatar.tsx)
- **Props**: 
  - `level`: number
  - `petStage`: number (optional)
  - `mood`: 'neutral' | 'happy' | 'tired' (default 'neutral')
- **Structure**:
  - SVG ViewBox `0 0 100 100`
  - `<defs>` for gradients.
  - `<circle>` Background (variable color).
  - `<g>` Head/Face implementation.
  - `<path>` Egg Overlay (renders if `petStage === 1`).
  - `<path>` Dragon/Pet features (optional future expansion).

### Styles

#### [MODIFY] [App.css](file:///home/deck/Projects/QuestArc/src/app/App.css)
- **Header HUD**:
  - `.hud-bar-hp`: `linear-gradient(90deg, #22c55e, #16a34a)`, `box-shadow: 0 0 10px rgba(34, 197, 94, 0.4)`.
  - `.hud-bar-xp`: `linear-gradient(90deg, #3b82f6, #6366f1)`.
  - `.hud-level`: Bold, larger font.
  - `.hud-values`: Monospace font for numbers.
- **Avatar**:
  - CSS Variables: `--avatar-primary`, `--avatar-secondary`.

## Verification Plan

### Automated Tests
- `npm run build`: Ensure no type errors.
- `npm run checkFile src/components/Header.tsx`: Lint check.
- `npm run checkFile src/components/Avatar.tsx`: Lint check.

### Manual Verification
1.  **Visual Check**:
    - Header: No settings cog.
    - HP Bar: Glowing green gradient.
    - XP Bar: Blue/Violet gradient.
    - Avatar: SVG renders.
2.  **Pet Integration**:
    - If Pet Stage = 1 (Egg), verify Egg overlay on Avatar.
3.  **Responsiveness**:
    - Verify on mobile viewport.
