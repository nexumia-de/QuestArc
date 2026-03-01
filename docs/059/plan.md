# Fix Footer Alignment

## User Review Required

> [!NOTE]
> This change will center the footer navigation bar.

## Proposed Changes

### Context Investigation

- The finding is that `NavBar` uses `left: 50%` + `transform` which can be inconsistent with the `margin: 0 auto` used by the main app container, especially with scrollbars.
- `box-sizing` is likely missing, causing padding to affect width.

### Components

#### [NavBar.tsx](file:///home/deck/Projects/QuestArc/src/components/NavBar.tsx)

- No changes to TSX needed.

#### [NavBar.css](file:///home/deck/Projects/QuestArc/src/components/NavBar.css)

- Add `box-sizing: border-box` to `.nav-bar`.
- Remove `left: 50%` and `transform: translateX(-50%)` from the media query.
- Rely on `left: 0; right: 0; margin: 0 auto; width: 100%; max-width: 600px;` to center the fixed element reliably.

## Verification Plan

### Manual Verification

- Run the app and visually verify the footer is centered.
- Use `browser_subagent` to capture a screenshot to confirm alignment.
