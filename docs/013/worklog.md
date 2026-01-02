# Worklog: Task 013 - Robust Dark Mode Fix

## Changes
-   **Robust Selectors**: Updated `App.css` to trigger dark mode variables using:
    -   `[data-theme='dark']` (Standard)
    -   `.dark-theme` (Common class strategy)
    -   `:root[class*='dark']` and `body[class*='dark']` (Catch-all for class naming variations)
    -   `@media (prefers-color-scheme: dark)` (System/Browser preference fallback)
-   **High Contrast**:
    -   Set `--text` to `#ffffff` (Pure White) in dark mode.
    -   Set `--text-muted` to `#e2e8f0` (Slate 200).
-   **Explicit Inheritance**:
    -   Added `color: var(--text)` to `.step-card` to prevent inheriting incorrect colors from parent containers.
    -   Added `color: var(--text-muted)` to `.step-card p`.

## Verification
-   Built successfully.
-   Variables cover all likely dark mode implementation scenarios in the host app.
