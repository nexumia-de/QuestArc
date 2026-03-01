# Worklog: Implement "Habit Stacker" Story Editor

## DONE

- [x] Modified `src/types/messages.ts` to include `SAVE_STORY` message type.
- [x] Updated `src/plugin.ts` to handle `SAVE_STORY` message:
  - Validates incoming story payload.
  - Adds or updates the story in `state.stories`.
  - Persists the state change.
- [x] Updated `src/app/App.tsx` to include the Editor UI:
  - Added `view` state to toggle between Dashboard and Editor.
  - Added `newStep` state for form data.
  - Implemented `saveStory` function to communicate with the Brain.
  - Added "New Quest" button and Editor form with fields for Title, Streak Goal, and XP.
- [x] Updated `src/app/App.css` to style the Editor UI (buttons, inputs, layout).
- [x] Verified build success (`npm run build`).

## Technical Notes

- The "Brain" (plugin.ts) serves as the source of truth for stories, treating `stories` as a data store.
- The "Face" (App.tsx) provides a simple form to create single-step "Habit Quests" (stories with 1 step).
- Data persistence is handled via `PluginAPI.persistDataSynced`.

## Next Steps

- Implement "Select Story" feature to activate one of the saved stories (currently we just save them).
- Add support for multi-step stories in the editor.
