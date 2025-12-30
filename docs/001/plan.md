# Plan: UI Improvements (001)

## Goal
Revamp the HeroicRPG plugin UI to achieve a "clean" and "premium" look, replacing the basic default styles with a cohesive design system.

## Analysis
-   **Persistence**: No changes to `plugin.ts` or state persistence are required. This is a pure UI overhaul.
-   **Protocol**: No new messages needed.
-   **Mobile**: The new UI must remain responsive.

## Proposed Changes
### Face (`src/app/App.css` & `src/app/App.tsx`)
1.  **Color Palette**: Implement deep space/fantasy theme.
    -   `--bg-dark`: #0b0e14
    -   `--primary`: #6366f1
    -   `--xp-gradient`: Amber/Gold
    -   `--hp-gradient`: Red/Pink
2.  **Typography**: Use 'Outfit' for headers and 'Inter' for body.
3.  **Components**:
    -   Add glassmorphism (`backdrop-filter`) to cards.
    -   Add smooth gradients to progress bars.
    -   Improve spacing and hierarchy.

## Verification
-   `npm run lint` (ensure no strict errors).
-   `npm run build` (ensure successful compilation).
-   Manual check of UI in browser/iframe.
