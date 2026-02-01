# Plan: Update README.md for Story Manager

## Goal
Update the main `README.md` to accurately reflect the new "Story Manager" system where users create stories via Projects with a Paper icon, rather than editing JSON files or just using a generic "Story Editor".

## Changes

### `README.md`

1.  **Quick Start**:
    *   Change the instructions to include "Create a Story Template" (New Project + Paper Icon).
    *   Explain how to "Play" a story (Start project).

2.  **Features**:
    *   Highlight "Project-based Story Creation".
    *   Mention "Seamless Integration" with Super Productivity's native projects.

3.  **How It Works**:
    *   Add a section "Creating Stories".
    *   Explain:
        1.  Create Project.
        2.  Set Icon to Paper (📄/📜).
        3.  Add Tasks (Steps) and Subtasks (Requirements).
        4.  Use Tags in Titles for game logic (`[freq]`, `[count]`, `⚔️`).

4.  **Project Structure**:
    *   Clarify that `src/assets/stories/` is for internal/default stories, but user stories are dynamic.

## Verification
-   Check that the README is clear for a new user.
-   Ensure it aligns with `SYNTAX_GUIDE.md` and `DATA_MODELS.md`.
