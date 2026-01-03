import { Task } from '@super-productivity/plugin-api';
import { QuestArcState } from '../types/state';
import { getCurrentStep, updateXp } from '../lib/state-manager';
import { initializeBossIfNeeded, processTaskCompletion } from '../lib/game-logic';
import { PluginService } from '../services/PluginService';
import { TaskService } from '../services/TaskService';

export interface TaskCompletePayload {
    task: Task;
}

export class TaskCompletionHandler {
    static async handle(state: QuestArcState, payload: unknown, saveCallback: (newState: QuestArcState) => Promise<void>) {
        const taskPayload = payload as TaskCompletePayload;

        PluginService.log.info('Task completed!', taskPayload);
        const currentStep = getCurrentStep(state);
        if (!currentStep) {
            PluginService.log.info('No current step found');
            return;
        }
        PluginService.log.info('Current step:', currentStep);

        // Initialize boss if needed
        let newState = initializeBossIfNeeded(state, currentStep);

        const result = processTaskCompletion(newState, taskPayload.task, currentStep);
        newState = result.newState;
        const { damageDealt, stepCompleted } = result;

        if (stepCompleted) {
            const xpResult = updateXp(newState, currentStep.xpReward);
            newState = xpResult.state;
            const leveledUp = xpResult.leveledUp;

            let snackMessage = `Quest Step Completed: ${currentStep.title}! +${currentStep.xpReward} XP`;
            if (leveledUp) {
                snackMessage += ` 🎉 Level Up! Now Level ${newState.profile.level}!`;
            }

            // Move to next step
            if (currentStep.nextStepId) {
                newState = {
                    ...newState,
                    activeStory: {
                        ...newState.activeStory,
                        currentStepId: currentStep.nextStepId,
                        taskProgress: {}
                    },
                    activeBoss: null
                };

                // Rename the host task to the new step title
                const nextStep = newState.activeStory && newState.stories
                    ? newState.stories.find(s => s.id === newState.activeStory.id)?.steps.find(step => step.id === currentStep.nextStepId)
                    : null;

                if (nextStep) {
                    try {
                        TaskService.updateTaskTitle(taskPayload.task.id, nextStep.title);

                        // Auto-create tasks for the new step
                        await TaskService.createTasksForStep(nextStep);

                        // Mark tasks as created for this new step
                        newState.activeStory.tasksCreatedForStepId = nextStep.id;

                    } catch (err) {
                        PluginService.log.error('Failed to update task title/create subtasks', err);
                    }
                }
            }

            PluginService.showSnack(snackMessage, 'SUCCESS');
        } else if (damageDealt > 0) {
            // Show damage notification for boss hits
            PluginService.showSnack(
                `💥 Dealt ${damageDealt} damage to boss! HP: ${newState.activeBoss?.hp}/${newState.activeBoss?.maxHp}`,
                'SUCCESS'
            );
        }

        await saveCallback(newState);
    }
}
