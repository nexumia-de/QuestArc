# Implement Circular XP Plugin Icon

Replace the static "trending_up" arrow icon in the Global Plugin Header with a dynamic circular progress indicator showing XP progress.

## User Review Required

> [!WARNING]
> **API Limitation Workaround**: The Super Productivity API `registerHeaderButton` **does not support custom SVGs** (it only accepts Material Icon names).
>
> **Solution**: We will use a **DOM Injection** strategy:
> 1. Register the button with a unique placeholder icon (e.g., `crop_free`).
> 2. Use a `MutationObserver` in `HeaderService` to watch the DOM.
> 3. When the placeholder icon appears, strictly replace it with our custom generated SVG `<img>`.

## Proposed Changes

### Logic

#### [HeaderService.ts](file:///home/deck/Projects/QuestArc/src/services/HeaderService.ts)

- **Modify `updateHeader`**:
  - Register button with `icon: 'crop_free'` (placeholder).
  - Call `this.replacePlaceholderWithIcon(state, 'crop_free')`.

- **Implement `replacePlaceholderWithIcon(state, placeholder)`**:
  - Generate SVG Data URI.
  - **Check if replacement already exists**: Look for `img#quest-arc-xp-icon`.
    - If found:
      - Update `src`.
      - **Trigger Animation**: Use `element.animate()` to pulse the icon (scale 1.2) for visual feedback.
      - Return.
  - **If not found**: Start `MutationObserver` to find `mat-icon` with `crop_free`.
    - Replace text with `<img>` having ID `quest-arc-xp-icon`.

#### [plugin.ts](file:///home/deck/Projects/QuestArc/src/plugin.ts)

- **Update `saveState`**:
  - Call `HeaderService.updateHeader(state)` after state updates to ensure the icon refreshes.

## Verification Plan

### Manual Verification
- **Visual Check**: Confirm the "crop_free" icon is explicitly replaced by the Circular XP icon.
- **Alignment**: Confirm the injected `<img>` respects the button layout.
- **Performance**: Ensure the observer doesn't cause lag or infinite loops.

