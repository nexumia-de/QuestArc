import { Task } from '@super-productivity/plugin-api';
import { QuestArcState } from '../types/state';
import { processTaskCompletion } from '../lib/game-logic';
import { PluginService } from '../services/PluginService';
import { CompilerService } from '../services/compiler.service';

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

        // Process task completion for game logic (XP, damage, etc.) first
        // We pass undefined for currentQuestStep because we no longer rely on legacy structure
        let newState = state;
        const result = processTaskCompletion(newState, task, undefined);
        newState = result.newState;
        const { damageDealt } = result;

        // Template-based quest logic only
        // Check if task belongs to an active quest project by looking at the project title (should have 🧭 icon)
        // ONLY process root tasks (tasks without a parent)
        if (task.projectId && !task.parentId) {
            PluginService.log.info(`[TaskCompletion] Root task completed with projectId: ${task.projectId}`);

            try {
                // We need to fetch all projects to check titles
                const allProjects = await PluginAPI.getAllProjects();
                const taskProject = allProjects.find(p => p.id === task.projectId);

                if (taskProject && taskProject.title.includes('🧭')) {
                    PluginService.log.info(`[TaskCompletion] Task belongs to active quest: "${taskProject.title}"`);

                    // Extract the base title (remove 🧭 and trim)
                    const baseTitle = taskProject.title.replace('🧭', '').trim();

                    // Find the template project (📜 + same base title)
                    const templateProject = allProjects.find(p =>
                        p.title.includes('📜') && p.title.replace('📜', '').trim() === baseTitle
                    );

                    if (templateProject) {
                        PluginService.log.info(`[TaskCompletion] Found template: "${templateProject.title}" (ID: ${templateProject.id})`);

                        // Get all tasks from the active quest to count how many have been created
                        const allTasks = await PluginAPI.getTasks();
                        const questTasks = allTasks.filter(t => t.projectId === task.projectId);
                        const rootQuestTasks = questTasks.filter(t => !t.parentId);
                        const createdCount = rootQuestTasks.length;

                        PluginService.log.info(`[TaskCompletion] Quest has ${createdCount} root tasks created`);

                        // Try to create the next task
                        const nextFound = await CompilerService.compileNextTask(
                            templateProject.id,
                            task.projectId,
                            createdCount
                        );

                        if (nextFound) {
                            PluginService.log.info(`[TaskCompletion] Next task created!`);
                            PluginService.showSnack('Next Quest Task Unlocked! 📜', 'SUCCESS');
                        } else {
                            // Quest completed! Change icon from 🧭 to ✅
                            PluginService.log.info(`[TaskCompletion] No more tasks - Quest completed!`);

                            try {
                                await PluginAPI.updateProject(task.projectId, {
                                    title: taskProject.title.replace('🧭', '✅')
                                });
                                PluginService.log.info(`[TaskCompletion] Updated project icon to ✅`);
                            } catch (error) {
                                PluginService.log.error('[TaskCompletion] Failed to update project icon:', error);
                            }

                            PluginService.showSnack(
                                `🎉 Quest Completed: "${baseTitle}"! 🏆\nCheck the plugin to archive this quest.`,
                                'SUCCESS'
                            );
                        }
                    } else {
                        PluginService.log.warn(`[TaskCompletion] No template found for quest "${baseTitle}"`);
                    }
                } else {
                    PluginService.log.info(`[TaskCompletion] Task project is not an active quest (no 🧭 icon)`);
                }
            } catch (error) {
                PluginService.log.error('[TaskCompletion] Error checking for quest:', error);
            }
        } else {
            if (task.parentId) {
                PluginService.log.info(`[TaskCompletion] Subtask completed (parentId: ${task.parentId}) - ignoring for quest progression`);
            } else {
                PluginService.log.info(`[TaskCompletion] Task has no projectId`);
            }
        }

        // Show damage notification for boss hits (if any generic boss logic remains)
        if (damageDealt > 0) {
            PluginService.showSnack(
                `💥 Dealt ${damageDealt} damage to boss! HP: ${newState.activeBoss?.hp}/${newState.activeBoss?.maxHp}`,
                'SUCCESS'
            );
        }

        // Apply task updates (e.g. for Grinds/Habits that shouldn't complete yet)
        if (result.taskUpdates) {
            try {
                // GUARD: Prevent infinite loops by checking if update is redundant.
                const currentIsDone = task.isDone;
                const newIsDone = result.taskUpdates.isDone;

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
