# Plan: Clarify Boss Lifecycle

## Goal
Clarify in documentation that Bosses are **Step-Bound**. They are not global enemies that persist across the entire project. They are specific challenges tied to a single "Step" (Task) in the story.

## Changes

### `docs/BOSS_GUIDE.md`
-   **Add Section**: "Boss Lifecycle".
-   **Explain**:
    -   Bosses are attached to specific steps.
    -   They "Spawn" when the step becomes active.
    -   They "Die" when the step is completed.
    -   They are **not** always present.

### `docs/SYNTAX_GUIDE.md`
-   Maybe add a note that Bosses are "Step Encounters".

## Verification
-   Ensure the language is clear about the ephemeral nature of bosses.
