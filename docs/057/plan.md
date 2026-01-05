# Critical Issues Fix

## Goal Description
Address three critical technical debt issues:
1.  **Incomplete CSS Extraction**: Move Dashboard-specific styles from `App.css` to `DashboardView.css` to achieve modularity.
2.  **Code Duplication**: Eliminate duplicate `MESSAGE_TYPES` definition.
3.  **Inconsistent Imports**: Standardize import organization across main views.

## User Review Required
> [!IMPORTANT]
> This refactor involves moving a significant amount of CSS. Visual regression testing of the Dashboard (active quest view) is recommended.

## Proposed Changes

### CSS Extraction (DashboardView)
#### [MODIFY] [App.css](file:///home/deck/Projects/QuestArc/src/app/App.css)
- Remove `DashboardView` specific styles:
    - `.step-card` and related children
    - `.boss-battle` and related children (consolidate multiple definitions)
    - `.quest-complete-overlay` and `.quest-complete-content`
    - `.empty-quest-state`
    - `.story-header-row` and `.story-progress-indicator`
    - `.story-block-container`, `.story-flavor-text`, `.story-details`, `.story-tooltip-container`
    - `.step-tasks` specific styles

#### [MODIFY] [DashboardView.css](file:///home/deck/Projects/QuestArc/src/components/DashboardView.css)
- Add all styles removed from `App.css`.
- Ensure strict ordering and remove duplicates (specifically for `.boss-battle`).

### Code Deduplication
#### [MODIFY] [plugin-utils.ts](file:///home/deck/Projects/QuestArc/src/lib/plugin-utils.ts)
- Remove `export enum MESSAGE_TYPES` definition.
- Import `MESSAGE_TYPES` from `../types/messages`.

### Import Organization
#### [MODIFY] [App.tsx](file:///home/deck/Projects/QuestArc/src/app/App.tsx)
#### [MODIFY] [CharacterView.tsx](file:///home/deck/Projects/QuestArc/src/components/CharacterView.tsx)
#### [MODIFY] [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx)
- Reorder imports to follow standard pattern:
    1. External specific libraries (SolidJS)
    2. Internal Types
    3. Services/Hooks/Utils
    4. Components
    5. Styles

## Verification Plan

### Automated Verification
- Run `npm run check` (if available) or `tsc --noEmit` to ensure no type errors after moving `MESSAGE_TYPES`.
- Run `npm run build` to verify build success.

### Manual Verification
1.  **Dashboard CSS**:
    - Start the app.
    - View an active quest on the Dashboard.
    - Verify "Step Card" styling (shadows, spacing, themes).
    - Verify "Boss Battle" styling (shake animation, hp bar floating head).
    - Verify "Quest Complete" overlay (if possible to trigger).
    - Verify "Empty State" styling (if no quest active).
2.  **Functionality**:
    - Ensure features using `MESSAGE_TYPES` (like syncing or task updates) still work.
