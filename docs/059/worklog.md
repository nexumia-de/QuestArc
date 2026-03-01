# Worklog: Fix Footer Alignment

## Summary

Fixed the footer alignment issue where the navigation bar was not centered correctly on larger screens or when scrollbars were present.

## Context

The `NavBar` component was using `left: 50%` and `transform: translateX(-50%)` which conflicted with the application's `max-width` container strategy and caused shifting issues.

## Changes

- **CSS**: Removed `transform` positioning in favor of `margin: 0 auto`.
- **CSS**: Added `box-sizing: border-box` to ensure padding doesn't affect the width calculations.
- **CSS**: Standardized `left: 0`, `right: 0`, and `width: 100%` combined with `max-width` for reliable centering.

## Verification

- [ ] Visual verification of footer alignment.
