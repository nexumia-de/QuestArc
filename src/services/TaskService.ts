import { StoryStep } from '../types/state';
import { PluginService } from './PluginService';

export class TaskService {
    static async createTasksForStep(step: Pick<StoryStep, 'title' | 'tasksToCreate'>, force: boolean = false): Promise<boolean> {
        if (!step.tasksToCreate) return true;

        let allCreated = true;

        for (const taskDef of step.tasksToCreate) {
            // Logic:
            // 1. Initial load (force=false): Create only Auto tasks.
            // 2. Button click (force=true): Create only Manual tasks.
            const shouldCreate = (taskDef.isAutoCreate && !force) || (!taskDef.isAutoCreate && force);

            if (shouldCreate && PluginService.api.addTask) {
                try {
                    const additionalFields: any = {
                        notes: taskDef.notes || `Quest Sub-task for: ${step.title}`
                    };

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
                    PluginService.log.info(`Created task: ${taskDef.title} (Auto: ${taskDef.isAutoCreate}, Force: ${force})`);
                } catch (e) {
                    PluginService.log.error(`Failed to create task: ${taskDef.title}`, e);
                }
            } else if (!taskDef.isAutoCreate && !force) {
                // If we skipped a manual task during initial load, we haven't created everything
                allCreated = false;
            }
        }
        return allCreated;
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
}
