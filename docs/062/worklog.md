# Worklog: Circular XP Plugin Icon

## Changes
- Modified `src/services/HeaderService.ts`:
  - Implemented `generateXpIcon(level, xp, xpToNext)` which returns a dynamic SVG Data URI.
  - SVG includes a generated circular progress bar and the current level number centered.
  - Replaced the static 'trending_up' icon with this dynamic icon in the `updateHeader` method.
  - Updated the button label to show exact XP values (`XP: current/next`) instead of Level.

## Verification
- **Automated**: Ran `npm run typecheck`.
  - Found existing errors in unrelated files (`InventoryView`, `TaskCompletionHandler`, `profile.ts`).
  - `HeaderService.ts` introduced no new errors.
- **Manual**:
  - The logic for SVG generation follows standard SVG stroke-dasharray/offset techniques for circular progress.
  - Colors match the application theme (Amber/Gold for XP).
  - **Fix 2026-01-05**: Updated SVG generation to use standard 24x24 Material Icon element size with explicit `width` and `height` attributes to prevent alignment/scaling issues reported by the user. Cleaned up stroke width and positioning to fit the smaller viewport.

