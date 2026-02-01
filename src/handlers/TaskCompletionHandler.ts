import { Task } from '../types/plugin-api';
import { QuestArcState } from '../types/state';
import { processTaskCompletion, TaskStub } from '../lib/game-logic';
import { PluginService } from '../services/PluginService';
import { CompilerService } from '../services/compiler.service';
import { BossService } from '../services/BossService';


export class TaskCompletionHandler {
    static async handle(state: QuestArcState, payload: unknown, saveCallback: (newState: QuestArcState) => Promise<void>) {
        let task: Task;

        // Normalize payload to get ID
        let taskId: string;
        if (typeof payload === 'string') {
            taskId = payload;
        } else if (payload && typeof payload === 'object' && 'task' in payload) {
            taskId = ((payload as any).task as Task).id;
        } else {
            taskId = (payload as Task).id;
        }

        // Always fetch fresh task from API to ensure parentId/projectId are present and correct
        try {
            const tasks = await PluginService.api.getTasks();
            const found = tasks.find(t => t.id === taskId);
            if (!found) {
                PluginService.log.warn(`TaskCompletionHandler: Task not found with ID ${taskId}`);
                return;
            }
            task = found as unknown as Task;
        } catch (e) {
            PluginService.log.error('Failed to fetch tasks', e);
            return;
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
        let newState = state;

        // Find the active story definition to get the steps
        const activeStoryDef = state.stories.find(s => s.id === state.activeStory.id);
        const currentStep = activeStoryDef?.steps.find(s => s.id === state.activeStory.currentStepId);

        let rootTask: TaskStub | undefined;
        if (task.parentId) {
            try {
                // We recursively look up the parent until we find the root
                const allTasks = await PluginService.api.getTasks();

                let currentParentId = task.parentId;
                let currentParent = allTasks.find(t => t.id === currentParentId);

                // Traverse up
                while (currentParent && currentParent.parentId) {
                    currentParentId = currentParent.parentId;
                    currentParent = allTasks.find(t => t.id === currentParentId);
                }

                if (currentParent) {
                    // Resolve root task tag names
                    let rootResolvedTagNames: string[] = [];
                    if (currentParent.tagIds && currentParent.tagIds.length > 0) {
                        try {
                            const allTags = await PluginService.api.getAllTags();
                            rootResolvedTagNames = currentParent.tagIds
                                .map(id => allTags.find(t => t.id === id)?.title)
                                .filter((name): name is string => !!name);
                        } catch (e) { /* ignore */ }
                    }

                    rootTask = {
                        tagIds: currentParent.tagIds || [],
                        title: currentParent.title,
                        notes: currentParent.notes,
                        resolvedTagNames: rootResolvedTagNames
                    };
                }
            } catch (e) {
                PluginService.log.warn('Failed to fetch root task for logic check', e);
            }
        }

        // Check if task belongs to an active quest project by looking at the project title (should have 🧭 icon)
        let isQuestTask = false;
        let taskProject = null;

        if (task.projectId) {
            try {
                const allProjects = await PluginService.api.getAllProjects();
                taskProject = allProjects.find(p => p.id === task.projectId);
                if (taskProject && taskProject.title.includes('🧭')) {
                    isQuestTask = true;
                }
            } catch (e) { /* ignore */ }
        }

        // Resolve tag names from tagIds
        let resolvedTagNames: string[] = [];
        if (task.tagIds && task.tagIds.length > 0) {
            try {
                const allTags = await PluginService.api.getAllTags();
                resolvedTagNames = task.tagIds
                    .map(id => allTags.find(t => t.id === id)?.title)
                    .filter((name): name is string => !!name);
                PluginService.log.debug('[TaskCompletionHandler] Resolved Tag Names:', resolvedTagNames);
            } catch (e) {
                PluginService.log.warn('Failed to resolve tag names:', e);
            }
        }

        const taskStub: TaskStub = {
            ...task,
            tagIds: task.tagIds || [],
            resolvedTagNames
        };

        const result = processTaskCompletion(newState, taskStub, currentStep, rootTask, isQuestTask);
        newState = result.newState;
        const { damageDealt } = result;

        // Template-based quest logic only
        // ONLY process root tasks (tasks without a parent)
        if (task.projectId && !task.parentId) {
            PluginService.log.info(`[TaskCompletion] Root task completed with projectId: ${task.projectId}`);

            try {
                // We already fetched projects above if needed
                if (!taskProject) {
                    const allProjects = await PluginService.api.getAllProjects();
                    taskProject = allProjects.find(p => p.id === task.projectId);
                }

                if (taskProject && taskProject.title.includes('🧭')) {
                    PluginService.log.info(`[TaskCompletion] Task belongs to active quest: "${taskProject.title}"`);

                    // Extract the base title (remove 🧭 and trim)
                    const baseTitle = taskProject.title.replace('🧭', '').trim();

                    const allProjects = await PluginService.api.getAllProjects();

                    // Find the template project (📜 + same base title)
                    const templateProject = allProjects.find(p =>
                        p.title.includes('📜') && p.title.replace('📜', '').trim() === baseTitle
                    );

                    if (templateProject) {
                        PluginService.log.info(`[TaskCompletion] Found template: "${templateProject.title}" (ID: ${templateProject.id})`);

                        // Get all tasks from the active quest
                        const allTasks = await PluginService.api.getTasks();

                        // New Logic: Check if the *completed* task has a sourceIndex
                        let targetIndexToLoad = 0;

                        // Parse the completed task's data to find its sourceIndex
                        // The `result` from processTaskCompletion might not include the full meta if we didn't parse it there for this purpose.
                        // But `task.notes` has it.
                        let sourceIndex = -1;
                        try {
                            const match = task.notes?.match(/```json\s*([\s\S]*?)\s*```/);
                            if (match && match[1]) {
                                const data = JSON.parse(match[1]);
                                if (typeof data.meta.sourceIndex === 'number') {
                                    sourceIndex = data.meta.sourceIndex;
                                }
                            }
                        } catch (e) { /* ignore */ }

                        if (sourceIndex !== -1) {
                            PluginService.log.info(`[TaskCompletion] Found sourceIndex: ${sourceIndex}. Loading next: ${sourceIndex + 1}`);
                            targetIndexToLoad = sourceIndex + 1;
                        } else {
                            // Fallback: Count rooted tasks (Legacy behavior for existing quests)
                            const questTasks = allTasks.filter(t => t.projectId === task.projectId);
                            const rootQuestTasks = questTasks.filter(t => !t.parentId);
                            const createdCount = rootQuestTasks.length;
                            PluginService.log.info(`[TaskCompletion] No sourceIndex found. Fallback to count: ${createdCount}`);
                            targetIndexToLoad = createdCount;
                        }

                        // Try to create the next task
                        const nextFound = await CompilerService.compileNextTask(
                            templateProject.id,
                            task.projectId,
                            targetIndexToLoad
                        );

                        if (nextFound) {
                            PluginService.log.info(`[TaskCompletion] Next task created!`);
                            PluginService.showSnack('Next Quest Task Unlocked! 📜', 'SUCCESS');
                        } else {
                            // Quest completed! Change icon from 🧭 to ✅
                            PluginService.log.info(`[TaskCompletion] No more tasks - Quest completed!`);

                            try {
                                await PluginService.api.updateProject(task.projectId, {
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
            if (task.parentId) {
                PluginService.log.info(`[TaskCompletion] Subtask completed (parentId: ${task.parentId}) - ignoring for quest progression`);
            } else {
                PluginService.log.info(`[TaskCompletion] Task has no projectId`);
            }
        }

        // --- Dynamic Boss Context (Sibling Damage) ---
        // If we don't have a valid currentStep for a boss, check if any sibling is a BOSS
        // This supports V2 Project structure where "Dragon [HP:100]" is a sibling subtask.
        let dynamicStep = currentStep;
        let bossTaskId: string | null = null; // Store boss task ID for updates
        let bossOriginalTitle: string | null = null;

        const noActiveBossLogic = !currentStep || currentStep.completion.type !== 'boss_defeat';

        if (noActiveBossLogic) {
            try {
                // Find siblings and check for Boss
                // BossService now returns both config AND taskId
                const bossResult = await BossService.scanForSiblingBoss(task);

                if (bossResult) {
                    const { config: boss, taskId } = bossResult;
                    bossTaskId = taskId;

                    PluginService.log.info(`[TaskCompletion] Found Sibling Boss: ${boss.name} (Task ID: ${taskId})`);

                    // Read HP from boss task's JSON (stateless - no caching)
                    // The boss config already has the current HP from JSON or title
                    newState.activeBoss = {
                        ...boss,
                        isDead: boss.isDead ?? false
                    };

                    // Store original title for later update
                    const allTasks = await PluginService.api.getTasks() as unknown as Task[];
                    const bossTask = allTasks.find(t => t.id === taskId);
                    if (bossTask) {
                        // Try to get original title from JSON notes
                        try {
                            const match = bossTask.notes?.match(/```json\s*([\s\S]*?)\s*```/);
                            if (match && match[1]) {
                                const data = JSON.parse(match[1]);
                                bossOriginalTitle = data.meta?.originalTitle || bossTask.title;
                            } else {
                                bossOriginalTitle = bossTask.title;
                            }
                        } catch (e) {
                            bossOriginalTitle = bossTask.title;
                        }
                    }

                    PluginService.log.info(`[TaskCompletion] Boss HP from source: ${boss.hp}/${boss.maxHp}`);

                    // Create Synthetic Step using the CURRENT HP from the boss task
                    dynamicStep = {
                        id: 999, // Synthetic ID
                        title: 'Dynamic Boss Battle',
                        xpReward: 0,
                        completion: {
                            type: 'boss_defeat',
                            config: {
                                boss: {
                                    hp: boss.hp,
                                    maxHp: boss.maxHp,
                                    isDead: boss.isDead,
                                    name: boss.name,
                                    themeColor: boss.themeColor
                                }
                            }
                        }
                    };
                }
            } catch (e) {
                PluginService.log.error('Error in Dynamic Boss Context', e);
            }
        }


        // Show damage notification for boss hits (if any generic boss logic remains)
        // We run the logic with the potentially synthetic step
        // Rerun processTaskCompletion? No, we ran it at the top (line 82) with `currentStep`.
        // If `currentStep` was undefined/wrong, `processTaskCompletion` did NO damage.
        // We must run it AGAIN if we found a dynamic boss.
        let finalDamage = damageDealt;

        if (dynamicStep && dynamicStep !== currentStep) {
            PluginService.log.info('[TaskCompletion] Re-running logic with Dynamic Boss Step');
            // FORCE isQuestTask = true because we explicitly found a Boss Context locally.
            // This bypasses the need for the 🧭 project icon or #QuestArc tags when fighting a visible boss.
            const forcedQuestContext = true;
            const reRunResult = processTaskCompletion(newState, { ...task, tagIds: task.tagIds || [] }, dynamicStep, rootTask, forcedQuestContext);
            newState = reRunResult.newState;
            finalDamage = reRunResult.damageDealt;

            // Use task updates from the re-run result (GRIND/HABIT progress)
            if (reRunResult.taskUpdates) {
                try {
                    const diff: Partial<Task> = { ...reRunResult.taskUpdates };
                    if (task.isDone === diff.isDone) delete diff.isDone;
                    if (task.title === diff.title) delete diff.title;
                    if (task.notes && diff.notes && task.notes.trim() === diff.notes.trim()) delete diff.notes;

                    if (Object.keys(diff).length > 0) {
                        PluginService.log.info('[TaskCompletion] Applying task updates (from re-run):', diff);
                        await PluginService.api.updateTask(task.id, diff);
                    }
                } catch (e) {
                    PluginService.log.error('Failed to apply re-run task updates', e);
                }
            }
        }

        // Update Boss Task JSON with new HP (Stateless Boss HP)
        // If we didn't find a sibling boss (bossTaskId is null), try to find the boss in the ACTIVE PROJECT
        if (finalDamage > 0 && !bossTaskId && newState.activeStory.id) {
            try {
                const projectBoss = await BossService.scanProjectForBoss(newState.activeStory.id);
                if (projectBoss) {
                    bossTaskId = projectBoss.taskId;
                    PluginService.log.info(`[TaskCompletion] Found Remote Boss Task: ${projectBoss.config.name} (ID: ${bossTaskId})`);

                    // fetch original title
                    const allTasks = await PluginService.api.getTasks() as unknown as Task[];
                    const bTask = allTasks.find(t => t.id === bossTaskId);
                    if (bTask) {
                        try {
                            const match = bTask.notes?.match(/```json\s*([\s\S]*?)\s*```/);
                            if (match && match[1]) {
                                const data = JSON.parse(match[1]);
                                bossOriginalTitle = data.meta?.originalTitle || bTask.title;
                            } else {
                                bossOriginalTitle = bTask.title;
                            }
                        } catch (e) {
                            bossOriginalTitle = bTask.title;
                        }
                    }
                }
            } catch (e) {
                PluginService.log.error('Failed to lookup remote boss task', e);
            }
        }

        if (finalDamage > 0 && bossTaskId && bossOriginalTitle && newState.activeBoss) {
            try {
                const newHp = newState.activeBoss.hp;
                const maxHp = newState.activeBoss.maxHp;

                await BossService.updateBossHp(bossTaskId, newHp, maxHp, bossOriginalTitle);
            } catch (e) {
                PluginService.log.error('Failed to update boss task HP', e);
            }
        }

        if (finalDamage > 0) {
            const bossName = newState.activeBoss?.name || 'Boss';
            PluginService.showSnack(
                `💥 Dealt ${finalDamage} damage to ${bossName}! HP: ${newState.activeBoss?.hp}/${newState.activeBoss?.maxHp}`,
                'SUCCESS'
            );
        }

        // Apply task updates (e.g. for Grinds/Habits that shouldn't complete yet) - Only if not already applied above
        const updates = result.taskUpdates; // Original updates (from first pass)

        if (updates && (!dynamicStep || dynamicStep === currentStep)) {
            try {
                const currentIsDone = task.isDone;
                const newIsDone = updates.isDone;

                const diff: Partial<Task> = { ...updates };
                if (currentIsDone === true && newIsDone === true) delete diff.isDone;
                if (task.title === diff.title) delete diff.title;
                if (task.notes && diff.notes && task.notes.trim() === diff.notes.trim()) delete diff.notes;

                if (Object.keys(diff).length > 0) {
                    PluginService.log.info('[TaskCompletion] Applying task updates (from first pass):', diff);
                    await PluginService.api.updateTask(task.id, diff);
                }
            } catch (e) {
                PluginService.log.error('Failed to apply task updates', e);
            }
        }

        // Save state
        await saveCallback(newState);
    }
}
