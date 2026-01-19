# Worklog: Remove Duplicate Quest Dashboard

## Changes
- Removed the fallback `QuestDashboard` from `DashboardView.tsx`.
- The `QuestDashboard` that is always present at the bottom of `DashboardView` is now the sole instance.

## Verification
- Ran `npm run build`. Build successful.
