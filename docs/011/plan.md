# Plan: UI Polish & Component Integration

## Goal
Improve the "QuestArc" plugin UI to feel more integrated, cleaner, and less "box-heavy". The current UI feels a bit separate from the host application. We aim for a smoother, effortless specific design.

## Proposed Changes

### 1. Refine Header (Compact Mode)
The current header takes up too much vertical space.
-   Reduce Avatar size from `80px` to `64px`.
-   Reduce container padding.
-   Move "Lvl X" next to the name or bars to save vertical space.
-   Clean up the Pet positioning to be less "floating".

### 2. Card Design "De-boxing"
-   Remove `border: 1px solid var(--border)` from main cards, relying on subtle shadows or background separation (`var(--card-bg)`).
-   Increase whitespace inside cards slightly for "breathing room" while reducing external margins.

### 3. Typography & Hierarchy
-   Reduce "Lvl X" font size.
-   Make "Current Story Step" label more subtle (uppercase, smaller, tracking-wide).

### 4. Action Buttons
-   Make secondary actions (like "My Quests") less heavy.
-   Ensure "Reset" is tucked away neatly, perhaps smaller text button.

## Files to Modify
-   `src/app/App.tsx`: Markup changes for header structure.
-   `src/app/App.css`: Styling updates for cleaner look.

## Verification
-   Visual check in Light Mode.
-   Visual check in Dark Mode.
-   Ensure mobile touch targets remain accessible (>44px).
