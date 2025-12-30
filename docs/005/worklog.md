# Worklog - Refactor Header UI (005)

## 2025-12-30

### 12:55 - Implementation Started
*   Created `src/assets/avatar.svg`.
*   Updated `QuestArcState` in `src/types/state.ts` to include `hp` and `maxHp` in `profile`.
*   Updated `INITIAL_STATE` in `src/lib/state-manager.ts` to initialize HP to 100/100.
*   Added `ensureState` migration helper in `src/lib/state-manager.ts` to add HP to existing saves.

### 12:57 - UI Refactor
*   Refactored `src/app/App.tsx` header:
    *   Removed text title "QuestArc".
    *   Added Avatar image.
    *   Made `Lvl X` the main headline.
    *   Added User HP bar below Level.
*   Updated `src/app/App.css` to style the new header layout (flexbox, avatar styling, green HP bar).

### 12:58 - Verification
*   Ran `npm run typecheck` - Passed.

### 13:00 - UI & Asset Fixes
*   **Fix:** Imported `avatar.svg` in `App.tsx` to resolve incorrect relative path usage.
*   **Fix:** Updated `.avatar` CSS to use `display: block` and `object-fit: cover` to ensure circular shape.
*   **Fix:** Updated `.level-headline` CSS to use `var(--primary)` and added a lighter indigo override (`#818cf8`) for dark mode to improve readability against dark backgrounds.

### 13:05 - Code Review Fixes
*   **Fix:** Updated `docs/history.md` with task 005 entry (was missing from Definition of Done).
*   **Fix:** Made `ensureState()` defensive - now handles case where `state.profile` is undefined.
*   **Fix:** Improved avatar alt text to be dynamic: `Level ${level} Hero` for better accessibility.
