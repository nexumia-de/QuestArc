# Plan: Dark Mode Contrast Fixes

## Goal
Improve text readability in dark mode, specifically addressing "hard to read" text.

## Proposed Changes

### 1. Update CSS Variables for Dark Mode
-   **`--text`**: Brighten to `#f8fafc` (Slate 50) from `#f1f5f9` (Slate 100) for slightly more pop.
-   **`--text-muted`**: Lighten significantly to `#cbd5e1` (Slate 300) from `#94a3b8` (Slate 400). The current slate-400 is too dark against the dark blue backgrounds.
-   **`--border`**: Lighten slightly in dark mode to define edges better.

### 2. Element-Specific Fixes
-   **`.bar-text-overlay`**: Ensure this text (over bars) is legible. If it's on a dark bar track, it needs to be light. If it's on a filled bar, it needs to contrast with the gradient.
    -   *Strategy:* Move this text *above* or *below* the bar if it's too small, or ensure it has a text-shadow.
-   **`.active-quest h2`**: Ensure the uppercase label is readable.
-   **Inputs**: Verify input text color follows `--text`.

## Components to Check
-   Header Stats
-   Quest Cards
-   Story List Cards
-   Editor Inputs

## Files to Modify
-   `src/app/App.css`

## Verification
-   Visual check of variable updates.
-   Check "Muted" text specifically.
