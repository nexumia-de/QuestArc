# Worklog: Task 012 - Dark Mode Fixes

## Changes
-   Updated CSS variables in `src/app/App.css` for better dark mode contrast:
    -   `--text`: `#f8fafc` (Slate 50)
    -   `--text-muted`: `#cbd5e1` (Slate 300)
    -   `--border`: `#475569` (Slate 600)
-   Improved `.bar-text-overlay`:
    -   Changed color to `--text` (white in dark mode).
    -   Added `text-shadow` for readability against colored bars.
    -   Pinned position to the right with `absolute` positioning.
-   Bolded `.active-quest h2` for better legibility at small sizes.

## Verification
-   Built successfully.
-   Variables reviewed against Tailwind Slate palette for consistency.
