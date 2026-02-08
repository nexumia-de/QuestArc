import { StoryStep } from '../types/state';
import { PluginService } from './PluginService';
import { cleanTaskTitle, formatTaskTitle } from '../lib/parsers';

export class TaskService {
    static async createTasksForStep(step: Pick<StoryStep, 'title' | 'tasksToCreate'>, force: boolean = false, projectId?: string | null): Promise<boolean> {
        if (!step.tasksToCreate) return true;

        let createdCount = 0;
        const tasksToCreateList = step.tasksToCreate;

        for (let i = 0; i < tasksToCreateList.length; i++) {
            const taskDef = tasksToCreateList[i];
            if (!taskDef) continue;

            const shouldCreate = (taskDef.isAutoCreate && !force) || (!taskDef.isAutoCreate && force);

            if (shouldCreate && PluginService.api.addTask) {
                try {
                    const payload = prepareTaskPayload(taskDef, step.title, projectId);
                    await PluginService.api.addTask(payload);

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

        if (!PluginService.api.getTasks) return false;

        if (PluginService.api.addTask) {
            try {
                const payload = prepareTaskPayload(nextTaskDef, step.title, projectId);
                await PluginService.api.addTask(payload);

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
                const match = task.notes!.match(/```json\s*([\s\S]*?)\s*```/);
                if (match && match[1]) {
                    try {
                        questData = JSON.parse(match[1]);
                    } catch (e) { continue; }
                }

                if (!questData || questData.meta.type !== 'HABIT') continue;

                // Use lastDoneDate as source of truth
                let lastCompletionTime = 0;
                if (questData.progress?.lastDoneDate) {
                    const d = new Date(questData.progress.lastDoneDate);
                    if (!isNaN(d.getTime())) lastCompletionTime = d.getTime();
                } else if (questData.progress?.lastUpdated) {
                    lastCompletionTime = questData.progress.lastUpdated;
                }

                if (lastCompletionTime < startOfDay) {
                    let streakBroken = false;

                    if (questData.progress?.streak) {
                        const startOfYesterday = startOfDay - (24 * 60 * 60 * 1000);

                        const wasFinished = (questData.progress.current || 0) >= (questData.progress.target || 1);
                        const updatedYesterday = lastCompletionTime >= startOfYesterday;

                        if (!updatedYesterday || !wasFinished) {
                            streakBroken = true;
                        }
                    }

                    if (streakBroken && questData.progress?.streak) {
                        questData.progress.streak.current = 0;
                    }

                    const baseTitle = cleanTaskTitle(task.title);
                    const newTitle = formatTaskTitle(baseTitle, questData.progress);

                    const updates = {
                        isDone: false,
                        title: newTitle,
                        notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
                    };

                    await PluginService.api.updateTask(task.id, updates);
                    resetCount++;
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

function prepareTaskPayload(taskDef: any, stepTitle: string | undefined, projectId?: string | null): any {
    const sTitle = stepTitle || 'Quest Step';
    const additionalFields: any = {
        notes: taskDef.notes || `Quest Sub-task for: ${sTitle}`
    };

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

    return {
        title: `${taskDef.title} #QuestArc`,
        ...additionalFields
    };
}
