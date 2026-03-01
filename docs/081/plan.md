# Plan: Add #QuestArc Tag to All Tasks

## Goal

Ensure all tasks created by the QuestArc plugin include the `#QuestArc` tag for better organization.

## Implementation Details

We will modify `TaskService.ts` to append `#QuestArc` to the task title or added as a tag during payload preparation.

### `src/services/TaskService.ts`

- Locate `prepareTaskPayload`.
- Append `#QuestArc` to the title if not present.
- If `tagIds` are supported and used, we might need a specific ID, but textual tag `#QuestArc` in the title is the standard Super Productivity way to auto-add tags if configured, or simply as a visual tag.
- Given the instruction "all tasks... should get the tag: #QuestArc", appending to the title is the most robust way unless we have a specific tag ID mechanism.

## Verification

- Create a manual task via the "Add Task" feature (if available) or trigger a quest step.
- Check if the created task title contains `#QuestArc`.
