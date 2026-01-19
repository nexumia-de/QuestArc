import { Task } from '@super-productivity/plugin-api';
import { QuestArcState } from '../types/state';
import { getCurrentStep, updateXp } from '../lib/state-manager';
import { initializeBossIfNeeded, processTaskCompletion } from '../lib/game-logic';
import { PluginService } from '../services/PluginService';
import { TaskService } from '../services/TaskService';
import { CompilerService } from '../services/compiler.service';

export interface TaskCompletePayload {
    task: Task;
}

export class TaskCompletionHandler {
    static async handle(state: QuestArcState, payload: unknown, saveCallback: (newState: QuestArcState) => Promise<void>) {
        let task: Task;

        // Normalize payload: It can be a string ID or an object { task: Task }
        if (typeof payload === 'string') {
            // It's an ID, we must fetch the task
            try {
                const tasks = await PluginAPI.getTasks();
                const found = tasks.find(t => t.id === payload);
                if (!found) {
                    PluginService.log.warn(`TaskCompletionHandler: Task not found with ID ${payload}`);
                    return;
                }
                task = found;
            } catch (e) {
                PluginService.log.error('Failed to fetch tasks', e);
                return;
            }
        } else if (payload && typeof payload === 'object' && 'task' in payload) {
            task = (payload as any).task;
        } else {
            // Assume payload IS the task (legacy or direct call)
            task = payload as Task;
        }

        if (state.activeStory.isCompleted) {
            PluginService.log.info('Task completed for completed quest. Ignoring.');
            return;
        }

        PluginService.log.info('TaskCompletionHandler: Processing task', {
            taskId: task.id,
            isQuestCompleted: state.activeStory.isCompleted,
            currentStepId: state.activeStory.currentStepId
        });

        PluginService.log.info('Task completed!', task);
        const currentStep = getCurrentStep(state);
        if (!currentStep) {
            PluginService.log.info('No current step found. Processing task for independent logic (Grind/Habit) only.');

            // SEQUENTIAL CUSTOM QUESTS
            if (state.activeStory.sourceTemplateId && state.activeStory.id) {
                const createdCount = state.activeStory.currentStepId;
                const nextFound = await CompilerService.compileNextTask(
                    state.activeStory.sourceTemplateId,
                    state.activeStory.id,
                    createdCount
                );

                if (nextFound) {
                    state.activeStory.currentStepId++;
                    PluginService.showSnack('Next Quest Task Unlocked! 📜', 'SUCCESS');
                } else {
                    // No next task found -> Quest Complete?
                    // Verify if the completed task was indeed part of the chain?
                    // For now, assume yes if sourceTemplateId is set.
                    state.activeStory.isCompleted = true;
                    PluginService.showSnack('Quest Completed! 🏆', 'SUCCESS');
                }
            }
        } else {
            PluginService.log.info('Current step:', currentStep);
        }

        // Initialize boss if needed
        let newState = currentStep ? initializeBossIfNeeded(state, currentStep) : state;

        const result = processTaskCompletion(newState, task, currentStep);
        newState = result.newState;
        const { damageDealt, stepCompleted } = result;

        if (stepCompleted && currentStep) {
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
                        TaskService.updateTaskTitle(task.id, nextStep.title || 'Next Step');

                        // Auto-create tasks for the new step
                        // Auto-create tasks for the new step
                        const allCreated = await TaskService.createTasksForStep(nextStep, false, newState.activeStory.id);

                        // Mark tasks as created for this new step ONLY if all were created
                        if (allCreated) {
                            newState.activeStory.tasksCreatedForStepId = nextStep.id;
                        } else {
                            newState.activeStory.tasksCreatedForStepId = null;
                        }

                        // Initialize boss for the new step if needed
                        newState = initializeBossIfNeeded(newState, nextStep);

                    } catch (err) {
                        PluginService.log.error('Failed to update task title/create subtasks', err);
                    }
                }
            } else {
                // No next step -> Quest Completed!
                newState.activeStory.isCompleted = true;
                snackMessage += " 🏆 QUEST COMPLETED!";
            }

            PluginService.showSnack(snackMessage, 'SUCCESS');
        } else {
            // SEQUENTIAL BUILT-IN
            if (currentStep) {
                const nextCreated = await TaskService.createNextTask(currentStep, task.title, state.activeStory.id);
                if (nextCreated) {
                    PluginService.showSnack('Next Sub-task Unlocked! 🗝️', 'SUCCESS');
                }
            }

            if (damageDealt > 0) {
                // Show damage notification for boss hits
                PluginService.showSnack(
                    `💥 Dealt ${damageDealt} damage to boss! HP: ${newState.activeBoss?.hp}/${newState.activeBoss?.maxHp}`,
                    'SUCCESS'
                );
            }
        }

        // Apply task updates (e.g. for Grinds/Habits that shouldn't complete yet)
        // Apply task updates (e.g. for Grinds/Habits that shouldn't complete yet)
        if (result.taskUpdates) {
            try {
                // GUARD: Prevent infinite loops by checking if update is redundant.
                // Especially for isDone, if we set it to true, we don't want to re-trigger completion.
                // We should fetch the latest task state to be sure? 
                // Or compare with the `task` object we derived everything from.

                const currentIsDone = task.isDone;
                const newIsDone = result.taskUpdates.isDone;

                // Optimization: Deep compare notes to see if they actually changed?
                // For now, let's just be careful about emitting isDone.

                const updatesToApply: Partial<Task> = { ...result.taskUpdates };

                // If task is already done, and we want it done -> remove isDone from update
                if (currentIsDone === true && newIsDone === true) {
                    delete updatesToApply.isDone;
                }

                // If title unchanged -> remove title
                if (task.title === updatesToApply.title) {
                    delete updatesToApply.title;
                }

                // If notes unchanged -> remove notes
                // We need to normalize strings (trim)
                if (task.notes && updatesToApply.notes && task.notes.trim() === updatesToApply.notes.trim()) {
                    delete updatesToApply.notes;
                }

                // Only update if there are keys left
                if (Object.keys(updatesToApply).length > 0) {
                    // Cast to any to bypass strict type mismatch between local Task type and PluginAPI Task type if they differ
                    await PluginAPI.updateTask(task.id, updatesToApply as any);
                } else {
                    PluginService.log.info('Skipping redundant task update to prevent loops.');
                }

            } catch (err) {
                PluginService.log.error('Failed to update task properties', err);
            }
        }

        await saveCallback(newState);
    }
}
