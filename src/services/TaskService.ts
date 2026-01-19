import { StoryStep } from '../types/state';
import { PluginService } from './PluginService';

export class TaskService {
    static async createTasksForStep(step: Pick<StoryStep, 'title' | 'tasksToCreate'>, force: boolean = false, projectId?: string | null): Promise<boolean> {
        if (!step.tasksToCreate) return true;

        let createdCount = 0;
        const tasksToCreateList = step.tasksToCreate;

        for (let i = 0; i < tasksToCreateList.length; i++) {
            const taskDef = tasksToCreateList[i];
            if (!taskDef) continue;

            // SEQUENTIAL: Only create the first task (index 0)
            if (i > 0) continue;

            // Logic:
            // 1. Initial load (force=false): Create only Auto tasks.
            // 2. Button click (force=true): Create only Manual tasks.
            const shouldCreate = (taskDef.isAutoCreate && !force) || (!taskDef.isAutoCreate && force);

            if (shouldCreate && PluginService.api.addTask) {
                try {
                    const additionalFields: any = {
                        notes: taskDef.notes || `Quest Sub-task for: ${step.title}`
                    };

                    // If projectId is provided, assign it
                    if (projectId) {
                        additionalFields.projectId = projectId;
                    }

                    if (taskDef.isRepeating && taskDef.repeatCfg) {
                        additionalFields.taskRepeatCfg = {
                            repeatEvery: 1, // Default to 1
                            repeatCycle: taskDef.repeatCfg.repeatType || 'DAILY',
                            startDate: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
                        };
                    }

                    await PluginService.api.addTask({
                        title: `${taskDef.title} #QuestArc`,
                        ...additionalFields
                    });

                    createdCount++;
                    PluginService.log.info(`Created task: ${taskDef.title} (Sequential: True, Project: ${projectId})`);
                } catch (e) {
                    PluginService.log.error(`Failed to create task: ${taskDef.title}`, e);
                }
            }
        }

        return true;
    }

    /**
     * Creates the next task in the sequence for a built-in step.
     */
    static async createNextTask(step: StoryStep, completedTaskTitle: string, projectId?: string | null): Promise<boolean> {
        if (!step.tasksToCreate) return false;

        // Find index of completed task
        // We match by title (ignoring #QuestArc suffix if present in title, but here we compare definition titles)
        const cleanTitle = completedTaskTitle.replace(' #QuestArc', '');
        const currentIndex = step.tasksToCreate.findIndex(t => t.title === cleanTitle);

        if (currentIndex === -1) {
            return false;
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex >= step.tasksToCreate.length) {
            return false;
        }

        const nextTaskDef = step.tasksToCreate[nextIndex];
        if (!nextTaskDef) return false;

        // Create it
        if (PluginService.api.addTask) {
            try {
                const additionalFields: any = {
                    notes: nextTaskDef.notes || `Quest Sub-task for: ${step.title}`
                };

                if (projectId) {
                    additionalFields.projectId = projectId;
                }

                if (nextTaskDef.isRepeating && nextTaskDef.repeatCfg) {
                    additionalFields.taskRepeatCfg = {
                        repeatEvery: 1,
                        repeatCycle: nextTaskDef.repeatCfg.repeatType || 'DAILY',
                        startDate: new Date().toISOString().split('T')[0],
                    };
                }

                await PluginService.api.addTask({
                    title: `${nextTaskDef.title} #QuestArc`,
                    ...additionalFields
                });

                PluginService.log.info(`Created NEXT task: ${nextTaskDef.title}`);
                return true;
            } catch (e) {
                PluginService.log.error(`Failed to create next task: ${nextTaskDef.title}`, e);
            }
        }
        return false;
    }

    static updateTaskTitle(taskId: string, newTitle: string) {
        if (PluginService.api.updateTask) {
            try {
                PluginService.api.updateTask(taskId, { title: newTitle });
                PluginService.log.info(`Updated task title to: ${newTitle}`);
            } catch (e) {
                PluginService.log.error(`Failed to update task title: ${taskId}`, e);
            }
        }
    }

    static async checkDailyResets(): Promise<void> {
        if (!PluginService.api.getTasks) return;

        try {
            const allTasks = await PluginService.api.getTasks();
            const habitTasks = allTasks.filter(t => t.notes && (t.notes.includes('```json') || t.notes.includes('{"meta"')));

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            let resetCount = 0;

            for (const task of habitTasks) {
                let questData = null;
                // Simplified parsing logic similar to game-logic
                const match = task.notes!.match(/```json\s*([\s\S]*?)\s*```/);
                if (match && match[1]) {
                    try {
                        questData = JSON.parse(match[1]);
                    } catch (e) { continue; }
                } else {
                    const rawJsonMatch = task.notes!.match(/\{[\s\S]*"meta"[\s\S]*\}/);
                    if (rawJsonMatch) {
                        try {
                            questData = JSON.parse(rawJsonMatch[0]);
                        } catch (e) { continue; }
                    }
                }

                if (!questData || questData.meta.type !== 'HABIT') continue;

                const lastUpdated = questData.progress?.lastUpdated || 0;

                // If last updated before today (and it feels "done" or has progress), reset it!
                // Logic: 
                // 1. If lastUpdated < today start -> It's a new day. We MUST reset `current` progress.
                // 2. STREAK CHECK: Did we do it yesterday?
                //    - If lastUpdated was within "Yesterday" (Start of Yesterday <= lastUpdated < Start of Today)
                //    - AND `current >= target` (it was finished)
                //    -> Streak is safe.
                //    - ELSE -> Streak broken! Reset to 0 (unless we just started it? No, strict.)

                if (lastUpdated < startOfDay) {
                    let streakBroken = false;

                    if (questData.progress?.streak) {
                        // Check if last update was "Yesterday"
                        // Yesterday Start = StartOfToday - 24h
                        const startOfYesterday = startOfDay - (24 * 60 * 60 * 1000);

                        // If it wasn't updated since before yesterday -> You missed a whole day -> Broken
                        // If it WAS updated yesterday, was it finished?
                        // "current" stores the count derived from JSON.
                        // But we are about to reset "current" to 0. 
                        // We rely on the fact that if it's "Done", `current` matches `target`.
                        // Wait, if it's < target, it wasn't finished.

                        // Was it finished yesterday?
                        const wasFinished = (questData.progress.current || 0) >= (questData.progress.target || 1);
                        const updatedYesterday = lastUpdated >= startOfYesterday;

                        if (!updatedYesterday || !wasFinished) {
                            streakBroken = true;
                        }
                    }

                    // Check if reset is needed:
                    // 1. If it has progress > 0
                    // 2. OR if it is checked (isDone=true)
                    // 3. OR if streak needs to be reset (visually update title)

                    if ((questData.progress?.current || 0) > 0 || task.isDone || streakBroken) {

                        questData.progress.current = 0;
                        questData.progress.lastUpdated = Date.now(); // reset buffer? or leave old? 

                        if (streakBroken && questData.progress?.streak) {
                            questData.progress.streak.current = 0;
                        }

                        // We must reset the title
                        // Strip (x/y)
                        let newTitle = task.title.replace(/\s*\(\d+\/\d+\)$/, '');
                        // Strip 🔥
                        newTitle = newTitle.replace(/\s*🔥\s*\d+(\/\d+)?$/, '');

                        // Re-add Streak (only if > 0)
                        if (questData.progress?.streak && questData.progress.streak.current > 0) {
                            const sCurrent = questData.progress.streak.current;
                            const sTarget = questData.progress.streak.target;
                            let streakStr = `🔥 ${sCurrent}`;
                            if (sTarget) streakStr += `/${sTarget}`;
                            newTitle = `${newTitle} ${streakStr}`;
                        }

                        const updates = {
                            isDone: false,
                            title: newTitle,
                            notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
                        };

                        await PluginService.api.updateTask(task.id, updates);
                        resetCount++;
                    }
                }
            }

            if (resetCount > 0) {
                PluginService.log.info(`Daily Reset: Reset ${resetCount} habit tasks for the new day.`);
            }

        } catch (e) {
            PluginService.log.error('Failed to check daily resets', e);
        }
    }
}
