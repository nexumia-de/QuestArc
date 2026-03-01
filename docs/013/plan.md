# Plan: Robust Dark Mode Fix

## Goal

Fix dark text on dark background issue definitively. The previous fix likely relied on a selector (`[data-theme='dark']`) that isn't active in the user's environment, despite the background appearing dark (likely due to other factors or partial matches).

## Proposed Changes

### 1. Robust Dark Theme Selector

Target all possible dark mode indicators:

```css
[data-theme="dark"],
.dark-theme,
:root[class*="dark"] {
  /* Variables */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Variables */
  }
}
```

### 2. High Contrast Variables

- **`--text`**: Set to `#ffffff` (Pure White) in dark mode to guarantee readability.
- **`--text-muted`**: Set to `#e2e8f0` (Slate 200).

### 3. Explicit Styling

- `.step-card`: Add `color: var(--text)`.
- `.step-card p`: Add `color: var(--text-muted)`.
- `.step-card h3`: Add `color: var(--text)`.

## Files to Modify

- `src/app/App.css`

## Verification

- Visual check.
- Build.
