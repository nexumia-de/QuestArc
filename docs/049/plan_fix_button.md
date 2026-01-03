# Plan: Fix Update Story Button

## Goal
Allow saving a story even if steps do not have titles, as per the previous schema change.

## User Review Required
> [!NOTE]
> The "Update Story" / "Forge Story" button was previously disabled if any step lacked a title. This logic will be updated to only require the *Story* title, but not individual *Step* titles.

## Proposed Changes

### UI Logic
#### [MODIFY] [EditorView.tsx](file:///home/deck/Projects/QuestArc/src/components/EditorView.tsx)
- Relax the `disabled` condition on the save button to allow `s.title` to be empty.

## Verification Plan

### Manual Verification
1.  Open Editor.
2.  Clear a step title.
3.  Observe that "Update Story" button remains enabled (as long as Story Title is present).
