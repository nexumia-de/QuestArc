# Simplify Header XP Icon

The user wants to revert to a simpler state where the Header **ALWAYS** displays the Circular XP Icon with Level.

## Requirements

- **Always Show XP Icon**: Remove logic that switches to Boss HP Skull.
- **Icon**: Circular progress bar with Level number inside (existing SVG logic).
- **Tooltip**: Hovering should show text "XP: [Current]/[Next]".
- **Animation**: Pulse on XP update.

## Proposed Changes

### [HeaderService.ts](file:///home/deck/Projects/QuestArc/src/services/HeaderService.ts)

- **Remove Boss Logic**: Delete the `if (state.activeBoss)` check in `updateHeader`.
- **Registration**:
  - Register button ONCE with `icon: 'crop_free'` (placeholder).
  - Label: `XP: ${xp}/${xpToNext}` (This provides the tooltip text in Super Productivity).
- **Update Logic (`replacePlaceholderWithIcon`)**:
  - **Always** generate and inject the XP SVG.
  - **Tooltip Update**: The user mentioned "hovering should show the xps".
    - `registerHeaderButton`'s `label` property usually acts as the tooltip AND the text next to the icon (depending on Super Productivity's layout).
    - **Issue**: The API doesn't allow updating the label after registration.
    - **Solution**: We must **update the Title/Tooltip** in the DOM manually if we want it to reflect dynamic changes without re-registering (which caused duplicates).
    - **Target**: Find the button and update `title` attribute or its text content if displayed.
    - _Correction_: The user said "hovering should show". This implies a tooltip.
    - We will update the button's `title` attribute or the `aria-label` / `matTooltip` if accessible.
    - _Simpler_: Just set the button's `title` attribute on every update.

## Restoration Plan

1.  **Simplify `updateHeader`**: Remove boss branching. Always call `replacePlaceholderWithIcon`.
2.  **Simplify `replacePlaceholderWithIcon`**:
    - Inject/Update SVG.
    - **Pulse Animation**: Keep (scale 1.2).
    - **Tooltip/Text**: Find the button, set `title` to `XP: 100/500`.

## Verification

- Start app.
- Verify Icon is Circle with Level.
- Hover icon -> See XP stats.
- Gain XP -> Icon fills, pulses, tooltip updates.
