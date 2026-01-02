# Polishing Story Creator UI

## Goal Description
The "Story Creator" UI currently looks cluttered and unpolished. This is primarily due to a mismatch between the CSS classes defined in `App.css` (which contain "premium" styles like pills and cleaner layouts) and the classes actually used in `EditorView.tsx`. The goal is to update `EditorView.tsx` to utilize these improved styles and further refine the CSS to remove visual noise (like excessive borders) and improve alignment.

## User Review Required
None. This is a visual polish task.

## Proposed Changes

### UI Components
#### [MODIFY] [EditorView.tsx](file:///home/deck/Projects/QuestArc/src/components/EditorView.tsx)
- Update `task-card` structure to match the "clean" CSS.
- Replace `task-options` with `task-options-row`.
- Replace distinct `label` inputs with specific classes like `checkbox-pill`.
- Improve the Repeat Config UI structure to use `repeat-settings-panel`.
- Remove manual `🔁` and `❗` text icons in favor of styled states or better icons if available (or keep text key if styled nicely).

### Styles
#### [MODIFY] [App.css](file:///home/deck/Projects/QuestArc/src/app/App.css)
- Refine `.task-card` to use a subtler background instead of a full border to reduce "box-in-box" noise.
- Ensure `.checkbox-pill` styles look good in dark mode.
- Adjust spacing/padding for a more "breathing" layout.
- Update `input` styles in the editor to be uniform.

## Verification Plan

### Manual Verification
- Open the Story Editor.
- Verify that task cards look cleaner (pills for options, better spacing).
- Toggle "Repeat" to check the repeat panel styling.
- Check Dark Mode to ensure contrast is correct.
