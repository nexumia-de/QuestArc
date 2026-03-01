# Next Steps: Habit Stacker Story Editor Enhancement

## Overview

This document outlines detailed implementation tasks to enhance the Habit Stacker Story Editor with story management, user feedback, validation, and multi-step story support.

---

## Feature 1: Story Selection UI

### Task 1: Add story list view to display all saved stories

- Create a new view mode: `'dashboard' | 'editor' | 'story-list'`
- Display list between dashboard and editor views
- Show "My Quests" section with all persisted stories

### Task 2: Create StoryCard component with story title, step count, and XP total

- Build reusable `StoryCard.tsx` component
- Display: story title, number of steps, total XP available
- Add visual styling consistent with existing card designs

### Task 3: Add 'Activate' button to each StoryCard to set as active story

- Add action button to each card
- Disable button if story is already active
- Update button text based on active state

### Task 4: Implement ACTIVATE_STORY message type in messages.ts

- Add `ACTIVATE_STORY` to `MESSAGE_TYPES`
- Create `ActivateStoryMessage` interface
- Update `PluginMessage` union type

### Task 5: Add ACTIVATE_STORY handler in plugin.ts to update activeStory state

- Implement handler in `onMessage` switch
- Find story by ID in `state.stories`
- Update `state.activeStory` with story data
- Reset `currentStepId` to first step
- Persist state changes

### Task 6: Add activateStory function in App.tsx to send ACTIVATE_STORY message

- Create async function to send message
- Handle response and sync state
- Return to dashboard after activation

### Task 7: Add visual indicator to show which story is currently active

- Add checkmark or badge to active story card
- Use different background color for active card
- Add "Currently Active" label

---

## Feature 2: User Feedback System

### Task 8: Implement toast notification system for success/error feedback

- Design toast notification architecture
- Create toast state management (queue system)
- Plan toast positioning and stacking

### Task 9: Add Toast component with auto-dismiss and animation

- Create `Toast.tsx` component
- Implement slide-in/fade-out animations
- Add auto-dismiss timer (3-5 seconds)
- Support different types: success, error, info

### Task 10: Show success toast when story is saved successfully

- Trigger toast after `saveStory` success
- Message: "Quest saved successfully!"
- Use success styling (green)

### Task 11: Show error toast when story save fails with error details

- Catch errors in `saveStory` function
- Display error message from backend
- Use error styling (red)
- Show helpful troubleshooting hints

---

## Feature 3: Form Validation

### Task 12: Add validation constraints: streak goal min=1 max=365, XP min=1 max=10000

- Add HTML5 validation attributes to inputs
- Implement JavaScript validation in form handler
- Define validation rules object
- Prevent form submission if invalid

### Task 13: Show inline validation errors for invalid form inputs

- Add error message elements below each input
- Display validation errors on blur/input
- Use red text and border for invalid fields
- Clear errors when user corrects input

---

## Feature 4: Multi-Step Story Editor

### Task 14: Extend editor to support multiple steps per story

- Change form data structure to array of steps
- Update UI to show all steps in editor
- Add step numbering/ordering UI

### Task 15: Add 'Add Step' button to create additional steps in editor

- Button to append new step to array
- Initialize with default values
- Scroll to new step after adding

### Task 16: Implement step ordering and nextStepId chaining in editor

- Auto-assign `nextStepId` based on order
- Last step has `nextStepId: undefined`
- Update chaining when steps are reordered
- Add drag-and-drop reordering (optional)

### Task 17: Add ability to remove steps from multi-step story editor

- Add delete button to each step (except if only 1 step)
- Confirm deletion for steps with content
- Update `nextStepId` chain after removal
- Re-index step IDs

---

## Feature 5: Story Management

### Task 18: Add delete story functionality with confirmation dialog

- Add delete button to StoryCard
- Show confirmation modal before deleting
- Warn if deleting currently active story
- Prevent deletion if it's the only story (optional)

### Task 19: Implement DELETE_STORY message type and handler in plugin.ts

- Add `DELETE_STORY` to `MESSAGE_TYPES`
- Create handler in `onMessage`
- Remove story from `state.stories` array
- If active story deleted, activate default/first story
- Persist state changes

### Task 20: Add edit story functionality to modify existing stories

- Add edit button to StoryCard
- Load story data into editor form
- Update save logic to handle edit vs create
- Show "Update Quest" button text when editing

---

## Implementation Priority

**Recommended order:**

1. **Story Selection UI** (Tasks 1-7) - Core functionality to make saved stories usable
2. **User Feedback** (Tasks 8-11) - Improves UX and debuggability
3. **Validation** (Tasks 12-13) - Prevents bad data
4. **Multi-Step Stories** (Tasks 14-17) - Advanced feature for habit chains
5. **Story Management** (Tasks 18-20) - CRUD completion

---

## Testing Checklist

After implementing each feature:

- [ ] Test with empty state (no stories)
- [ ] Test with one story
- [ ] Test with multiple stories
- [ ] Test edge cases (very long names, max values, etc.)
- [ ] Verify state persistence across plugin reloads
- [ ] Check for console errors
- [ ] Verify UI responsiveness
- [ ] Test accessibility (keyboard navigation, screen readers)

---

## Technical Notes

- Maintain Brain/Face architecture separation
- Use existing message-passing patterns
- Follow existing CSS conventions and design system
- Keep components small and focused
- Add comments for complex logic
- Update documentation as features are added
