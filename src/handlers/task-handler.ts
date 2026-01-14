import { Persistence } from '../lib/persistence';
import { processTaskCompletion } from '../lib/game-logic';
import { Task } from '../types/plugin-api';

export class TaskHandler {
    static async handleTaskComplete(taskOrId: Task | string) {
        // Optimization: Use provided Task object if available to avoid getTasks() call
        let task: Task | undefined;

        if (typeof taskOrId === 'string') {
            console.log('[QuestArc] Fetching task details for ID:', taskOrId);
            const allTasks = await PluginAPI.getTasks();
            task = allTasks.find((t: Task) => t.id === taskOrId);
        } else {
            console.log('[QuestArc] Using provided task object:', taskOrId.id);
            task = taskOrId;
        }

        if (!task) {
            console.warn('[QuestArc] Task not found or invalid payload');
            return;
        }

        console.log('[QuestArc] Handling task completion:', task.id);

        // 1. Get current state
        // 1. Get current state
        const state = Persistence.loadState();
        if (!state.activeStory.id) {
            console.log('[QuestArc] No active story, ignoring task.');
            return;
        }

        // 3. Get Current Story Step
        const story = state.stories.find(s => s.id === state.activeStory.id);
        if (!story) {
            console.warn('[QuestArc] Active story not found in state:', state.activeStory.id);
            return;
        }

        const step = story.steps.find(s => s.id === state.activeStory.currentStepId);
        if (!step) {
            console.warn('[QuestArc] Current step not found:', state.activeStory.currentStepId);
            return;
        }

        // 4. Process Logic
        // We use a simplified TaskStub for logic to avoid full Task dependency issues if they differ
        const taskStub = {
            title: task.title,
            tagIds: task.tagIds || [],
            notes: task.notes
        };

        const result = processTaskCompletion(state, taskStub, step);

        // 5. Notify User of Changes (Existing logic...)
        if (result.xpGained > 0) {
            PluginAPI.notify({
                title: 'XP Gained! ✨',
                body: `+${result.xpGained} XP`,
                ico: 'star'
            });
        }

        // ... (Damage/LevelUp/StepComplete not shown for brevity, staying same) ...
        if (result.damageDealt > 0) {
            PluginAPI.notify({
                title: 'Boss Hit! ⚔️',
                body: `You dealt ${result.damageDealt} damage!`,
                ico: 'gavel'
            });
        }
        if (result.leveledUp) {
            PluginAPI.notify({
                title: 'LEVEL UP! 🎉',
                body: `You are now Level ${result.newState.profile.level}!`,
                ico: 'arrow_upward'
            });
            PluginAPI.showSnack({
                msg: `LEVEL UP! You reached Level ${result.newState.profile.level}`,
                type: 'SUCCESS',
                ico: 'arrow_upward'
            });
        }
        if (result.stepCompleted) {
            // ...
            // (Copy existing Step Logic)
            const nextStepId = step.nextStepId;
            if (nextStepId !== undefined && nextStepId !== null) {
                console.log(`[QuestArc] Step Completed. Advancing to ${nextStepId}`);
                result.newState.activeStory.currentStepId = nextStepId;
                result.newState.activeStory.tasksCreatedForStepId = null;
                PluginAPI.notify({
                    title: 'Step Complete! 📜',
                    body: 'The story continues...',
                    ico: 'auto_stories'
                });
            } else {
                console.log('[QuestArc] Story Completed.');
                result.newState.activeStory.isCompleted = true;
                PluginAPI.notify({
                    title: 'Quest Complete! 🏆',
                    body: 'You have finished the story!',
                    ico: 'emoji_events'
                });
            }
        }

        // 6. Handle Task Updates (Grind/Habit)
        if (result.taskUpdates) {
            console.log('[QuestArc] Updating task state (Grind/Habit):', task.id, result.taskUpdates);
            PluginAPI.updateTask(task.id, result.taskUpdates);
        }

        // 7. Persist
        Persistence.saveState(result.newState);
    }
}
