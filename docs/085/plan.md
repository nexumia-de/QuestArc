# Plan: Global Documentation Fact Check & Cleanup

## Goal
Remove outdated references to the "old" way of doing things (JSON stories, specific legacy syntax in notes).

## Changes

### 1. `docs/STORIES.md`
-   **Action**: DELETE or REWRITE.
-   **Reason**: It describes the deprecated JSON format.
-   **New Content**: A pointer to `SYNTAX_GUIDE.md` explaining that Stories are now Projects.

### 2. `docs/ROADMAP.md`
-   **Action**: UPDATE.
-   **Reason**: It references specific implementation details like "Write `{ ...progress, current: 6 }` to `task.notes`". While this might still be true internally, the *user-facing* roadmap or specs should reflect the current "Story Manager" goal.
-   **Cleanup**: Remove the heavy technical specs that might be confusing or outdated if they don't match exactly. Better to keep it high-level.

### 3. `docs/PLUGIN_DEVELOPMENT_GUIDE.md`
-   **Action**: CHECK & UPDATE.
-   **Section to check**: "Adding a New Story Type" (Line 64). It mentions `src/types/story.ts` and `StoryService`. This process has likely changed with the new "Scanner" approach.
-   **Update**: Change "Common Tasks" to reflect the new architecture if possible, or remove that section if it's too specific.

### 4. `docs/QUICK_START` / `GETTING_STARTED`
-   (If they existed, but checked listing, only `PLUGIN_DEVELOPMENT_GUIDE.md` acts as start guide).

## Verification
-   Ensure no file instructs the user to write JSON manually.
-   Ensure all files point to the Project/Template system.
