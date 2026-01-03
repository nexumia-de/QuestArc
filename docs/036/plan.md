# Plan: Fix Missing Add Task Button

## Problem
When a story step has tasks defined but they are not configured to be added automatically, the user currently has no way to add them because the button is missing.

## Analysis
- The UI likely hides the button based on a condition that is too restrictive or incorrect.
- Need to check `DashboardView.tsx` or wherever the current step logic is handled.

## Proposed Changes
1.  Identify the component rendering the current step.
2.  Adjust the condition for the "Add Tasks" button to ensure it shows up when there are pending tasks for the step that aren't in the user's list yet.

## Verification
- Create/Use a story step with manual tasks.
- Ensure button is visible.
