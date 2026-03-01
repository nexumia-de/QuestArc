# Plan: Align Collapsed Text Field to Left

## Goal

The user wants to align the collapsed text field (the "Story so far" summary) to the left side. Currently, the text is on the left but the chevron indicator is on the far right, creating a split view which the user finds undesirable. The goal is to move the chevron to the left, next to the text, for a standard left-aligned accordion look.

## Proposed Changes

### CSS (`src/app/App.css`)

- Update `.story-summary`:
  - Change `justify-content` from `space-between` to `flex-start`.
  - Add `gap` to space the chevron and text.
- Update `.story-summary` pseudo-elements:
  - Change `::after` (the chevron) to `::before`.
  - Adjust margins/padding to ensure proper spacing.
  - Ensure rotation logic for the chevron works with `::before`.

## Verification Plan

### Manual Verification

1. Open the Dashboard with an active story.
2. Ensure the "Story so far" or "Step Summary" is displayed.
3. Verify that the chevron is on the left side of the text.
4. Verify that the text immediately follows the chevron.
5. Verify that clicking still toggles the details.
6. Verify that the chevron rotates correctly when expanded.
