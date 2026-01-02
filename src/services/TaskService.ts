import { StoryStep } from '../types/state';
import { PluginService } from './PluginService';

export class TaskService {
    static async createTasksForStep(step: Pick<StoryStep, 'title' | 'tasksToCreate'>) {
        if (!step.tasksToCreate) return;

        for (const taskDef of step.tasksToCreate) {
            if (taskDef.isAutoCreate && PluginService.api.addTask) {
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
                        title: taskDef.title,
                        ...additionalFields
                    });
                    PluginService.log.info(`Auto-created task: ${taskDef.title} (Repeat: ${taskDef.isRepeating})`);
                } catch (e) {
                    PluginService.log.error(`Failed to auto-create task: ${taskDef.title}`, e);
                }
            }
        }
    }

    static updateTaskTitle(taskId: string, newTitle: string) {
        if (PluginService.api.updateTask) {
            PluginService.api.updateTask(taskId, { title: newTitle });
            PluginService.log.info(`Updated task title to: ${newTitle}`);
        }
    }
}
