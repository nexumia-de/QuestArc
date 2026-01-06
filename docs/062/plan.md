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
  - Call `this.initIconReplacer(state)`.

- **Implement `initIconReplacer(state)`**:
  - Generate the SVG Data URI using `generateXpIcon`.
  - Set up a `MutationObserver` on `document.body` (or specific header container if possible).
  - Watch for `<mat-icon>` elements with text content `crop_free`.
  - When found:
    - Clear its text content.
    - Append an `<img src="${dataUri}" ...>` element styled to fit (24x24).
    - Disconnect observer to save performance (or keep watching if header re-renders are frequent).

## Verification Plan

### Manual Verification
- **Visual Check**: Confirm the "crop_free" icon is explicitly replaced by the Circular XP icon.
- **Alignment**: Confirm the injected `<img>` respects the button layout.
- **Performance**: Ensure the observer doesn't cause lag or infinite loops.

