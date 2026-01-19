# Worklog: Sequential Task Loading (078)

## Changes
- **CompilerService**: 
    - Updated `compileQuest` to only clone the first root task from the template initially.
    - Added `compileNextTask` to clone the next task in the sequence upon request.
- **TaskService**:
    - Updated `createTasksForStep` to only create the first defined task for built-in steps.
    - Added `createNextTask` to create the next task in the definition list.
    - Removed legacy "Move to Backlog" logic as tasks are now created just-in-time.
- **QuestManagerService**:
    - Updated `startQuest` to save the `sourceTemplateId` in `QuestArcState.activeStory`.
    - Updated `activeStory.id` to correctly point to the new active project ID.
- **TaskCompletionHandler**:
    - Added logic to detect if the completed task belongs to a sequential chain.
    - For **Custom Quests**: triggers `CompilerService.compileNextTask` using the stored `sourceTemplateId`.
    - For **Built-in Quests**: triggers `TaskService.createNextTask`.
- **State**:
    - Added `sourceTemplateId` to `QuestArcState.activeStory`.

## Verification Results
- **Build**: `npm run build` passed successfully.
- **Logic Check**: 
    - Confirmed `compileQuest` stops after cloning index 0.
    - Confirmed `createTasksForStep` stops after index 0.
    - Confirmed `TaskCompletionHandler` correctly identifies next task index and calls appropriate service.

## Next Steps
- Manual testing in Super Productivity to ensure specific edge cases (empty templates, single-task quests) work as expected.
