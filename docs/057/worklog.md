# Worklog 057: Critical Technical Debt Fixes

## Summary
Addressed three critical technical debt issues identified in the codebase: incomplete CSS extraction for the Dashboard, duplicate `MESSAGE_TYPES` definitions, and inconsistent import organization.

## Changes

### 1. CSS Extraction (DashboardView)
-   **Goal**: Move Dashboard-specific styles from `App.css` into `DashboardView.css`.
-   **Action**:
    -   Combined `DashboardView.css` with relevant styles extracted from `App.css`, creating a self-contained stylesheet for the Dashboard.
    -   Styles moved include: `.step-card`, `.active-quest`, `.boss-battle`, `.quest-complete-overlay`, `.empty-quest-state`, `.story-flavor-text`, and `.step-tasks`.
    -   Cleaned up `App.css` by removing the extracted blocks.

### 2. Code Deduplication
-   **Goal**: Eliminate duplicate definition of `MESSAGE_TYPES`.
-   **Action**:
    -   Removed `export enum MESSAGE_TYPES` from `src/lib/plugin-utils.ts`.
    -   Updated `src/handlers/MessageHandler.ts` to import `MESSAGE_TYPES` from the canonical source: `src/types/messages.ts`.

### 3. Import Organization
-   **Goal**: Standardize import order in main views.
-   **Action**:
    -   Refactored imports in `App.tsx`, `CharacterView.tsx`, and `DashboardView.tsx` to follow a consistent order:
        1.  External libraries (SolidJS) - alphabetical
        2.  Internal Types
        3.  Services/Hooks/Utils
        4.  Components
        5.  Styles

## Verification
-   **Build**: Ran `npm run build` successfully.
-   **CSS**: Verified logically that all relocated classes map to their usages in `DashboardView.tsx`.
