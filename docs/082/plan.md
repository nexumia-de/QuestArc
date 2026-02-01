# Plan: Story Manager Documentation Rewrite

## Goal
Rewrite documentation to reflect the new "Story Manager" paradigm where Stories are defined by Projects with a "Paper" icon/template, and game logic parses these into quests.

## Context
The user has shifted the goal of QuestArc. Instead of a purely JSON-based story definition, users will create stories using the native Project/Task system.
- **Story** = Project
- **Template** = Project with "Paper" icon/template mark.
- **Task** = Step
- **Subtask** = Requirement

## Changes

### 1. `docs/SYNTAX_GUIDE.md`
- **Rename**: Maybe keep the name but change the focus to "Story & Task Syntax".
- **New Section: Story Templates**:
    - Explain how to create a Story Template (New Project -> Icon: Paper).
    - Explain how to define Steps (Tasks) and Requirements (Subtasks).
- **Existing Sections**:
    - Update context to show these live within Story Projects.
    - **Habits/Grinds**: Confirm syntax `[freq:...]` and `[count:N]` still applies in this new context.
    - **Bosses**: Explain adding Bosses as tasks (?) or as specific steps.

### 2. `docs/DATA_MODELS.md`
- Clarify the separation between the **User Model** (Projects/Tasks) and the **Internal State** (ActiveStory, etc.).
- The `HeroStory` interface might effectively be the "Parsed Project" structure.

## Verification
- Review the generated docs to ensure they match the user's description.
- No code changes are requested, only docs.
