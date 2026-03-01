h# Plan: Add Modal Styles

## Goal

Fix the "Start Quest" confirmation to appear as a proper popup modal instead of inline text.

## User Review Required

None.

## Proposed Changes

### Styles

#### [MODIFY] [App.css](file:///home/deck/Projects/QuestArc/src/app/App.css)

- Add `.modal-overlay`:
  - `position: fixed`
  - `top: 0`, `left: 0`, `right: 0`, `bottom: 0`
  - `background: rgba(0, 0, 0, 0.7)`
  - `z-index: 1000`
  - Flex center alignment
- Add `.modal`:
  - `background: var(--card-bg)`
  - `padding: 2rem`
  - `border-radius: 12px`
  - `box-shadow: var(--shadow-lg)`
  - `max-width: 90%`
  - `width: 400px`
  - `text-align: center`
- Add `.modal-actions`:
  - Flex layout for buttons

## Verification Plan

1. Open "My Quests".
2. Click a quest.
3. Verify the overlay covers the screen and the dialog is centered.
