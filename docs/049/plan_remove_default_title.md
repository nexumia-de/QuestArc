# Plan: Remove Default Step Title

## Goal

Remove the fallback "Step X" title when a step has no title. If no title is provided, the header should be hidden entirely.

## User Review Required

> [!NOTE]
> Steps without titles will now display NO header in the dashboard, rather than "Step 1", "Step 2", etc.

## Proposed Changes

### Logic

#### [MODIFY] [story.ts](file:///home/deck/Projects/QuestArc/src/lib/state/story.ts)

- Update `getCurrentStepTitle` to return `string | undefined`.
- Remove the "Step X" generation logic.
- If `currentStep` exists but has no title, return `undefined` (or empty string).

### UI

#### [MODIFY] [DashboardView.tsx](file:///home/deck/Projects/QuestArc/src/components/DashboardView.tsx)

- Conditionally render `.step-card-header` only if `getCurrentStepTitle` returns a value.

## Verification Plan

### Manual Verification

1.  Open Editor and ensure a step has no title.
2.  Save and Run.
3.  Verify Dashboard shows the step content but NO "Step X" header.
