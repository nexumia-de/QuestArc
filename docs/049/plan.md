# Plan: Optional Step Title

## Goal
Make the `title` field in `StoryStep` optional.

## User Review Required
> [!NOTE]
> When a step title is missing, the UI will display "Step X" (where X is the step number) instead.

## Proposed Changes

### Data Model
#### [MODIFY] [state.ts](file:///home/deck/Projects/QuestArc/src/types/state.ts)
- Change `title: string` to `title?: string` in `StoryStep` interface.

### Logic
#### [MODIFY] [story.ts](file:///home/deck/Projects/QuestArc/src/lib/state/story.ts)
- Update `getCurrentStepTitle` to return "Step X" if title is missing, instead of falling back to Story ID.

### Documentation
#### [MODIFY] [DATA_MODELS.md](file:///home/deck/Projects/QuestArc/docs/DATA_MODELS.md)
- Update `StoryStep` definition to show `title` as optional.

## Verification Plan

### Automated Tests
- N/A (Unit tests might need update if they strictly require title)

### Manual Verification
1.  Open Story Editor.
2.  Create a step without a title.
3.  Save/Run the story.
4.  Verify that on the dashboard, it shows "Step X" instead of crashing or showing weird text.
