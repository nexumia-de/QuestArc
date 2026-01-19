# Worklog: Restoring Template Support

## Goal
Restore user ability to use custom project templates (`📜`) instead of the hardcoded system quest.

## Changes
1.  **Re-implemented `CompilerService`:** Created a lightweight version (`src/services/compiler.service.ts`) that clones projects and tasks (including subtasks) from a template ID.
2.  **Restored Scanner Logic:** Updated `ProjectScannerService` to identify projects starting with `📜` as `TEMPLATE` type.
3.  **Updated QuestDashboard:** Replaced the "Built-in Stories" section with "AVAILABLE TEMPLATES".
4.  **Cleaned Persistence:** Removed the hardcoded "Productivity Mastery" story from `DEFAULT_STATE` to save space and avoid auto-starting it.

## Verification
- **Manual:**
    - [ ] Create a project "📜 My Quest" in Super Productivity.
    - [ ] Add tasks to it.
    - [ ] Open QuestArc Dashboard.
    - [ ] Verify "My Quest" appears in "Available Templates".
    - [ ] Click "Start".
    - [ ] Verify "My Quest 🧭" is created and tasks are cloned.
