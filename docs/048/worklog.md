# Worklog: Story Visual Overhaul (ID 048)

## 1. Context

The goal was to improve the visual storytelling of QuestArc by separating narrative text from functional tasks and enhancing boss encounters. We also aimed to keep the UI clean using progressive disclosure.

## 2. Changes Implemented

### Data Models

- Modified `StoryStep` in `src/types/state.ts` to include:
  - `flavor_text`: For narrative descriptions.
  - `display_mode`: Controls visibility ('visible', 'collapsed', 'tooltip').
  - `environment_theme`: Allows custom color accents per step.

### Editor

- Updated `StepBuilder.tsx` to include inputs/selectors for the new fields.
- Updated `useStoryEditor.ts` to initialize and manage these fields.

### Visualization (DashboardView)

- Implemented "Story Block" UI with distinct typography (Italic, Georgia).
- Implemented **Progressive Disclosure**:
  - `collapsed`: Uses `<details>`/`<summary>` for a scroll-like expander.
  - `tooltip`: Shows a subtle "Lore" icon with hover text.
- Added **Story Progress Indicator** (Step X/Y) to the header.
- **Enhanced Boss UI**:
  - Added CSS-based "Shake" animation when boss takes damage (hp < maxHp).
  - Added theme color support for boss cards (`border-color`, `text-color`, `active-bar`).

### Styling

- Added comprehensive CSS rules in `src/app/App.css` for:
  - `.story-flavor-text`, `.story-details`, `.story-summary`
  - `.boss-shake` animation
  - `.step-card.themed-step` for environment accents.

## 3. Verification

- **Build**: `npm run build` passed successfully.
- **Code Review**: Verified that fallbacks exist for new optional fields to prevent regressions on existing stories.

## 4. Refinements (User Feedback)

- **Tooltip**: Changed from "Lore" text to a customizable Book Icon (`📖`).
  - Implemented a CSS-only custom tooltip styling to fix overflow and layout issues ("custom icon instead of text", "doesn't fit into space").
- **Layout & Visuals**:
  - **Separate Sections**: Added a subtle divider line (`story-divider`) between the narrative block and the task list.
  - **Header Logic**: Only renders the header block if a title is set, making the UI cleaner for simple steps.
  - **Scrollable Content**: Added `max-height: 300px` and custom scrollbar styling to the narrative block to prevent long texts from overwhelming the card.
  - **Task List UI**: Refactored to a cleaner list style with right-aligned progress badges.
  - **Completed Tasks**: Added visual feedback (opacity reduction + strikethrough) for completed tasks to focus attention on remaining work.
  - **Rotating Chevron**: Added a smooth rotating arrow to the collapsed story summary to indicate expandability.

## 5. Next Steps

- User to verify the new "Clean Layout" and check if the completed task visualization provides better focus.
