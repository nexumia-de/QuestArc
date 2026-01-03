import { StoryStep } from '../types/state';
import { PluginService } from './PluginService';

export class TaskService {
    static async createTasksForStep(step: Pick<StoryStep, 'title' | 'tasksToCreate'>, force: boolean = false): Promise<boolean> {
        if (!step.tasksToCreate) return true;

        let allCreated = true;

        for (const taskDef of step.tasksToCreate) {
            // Create if it's auto-create OR if forced
            if ((taskDef.isAutoCreate || force) && PluginService.api.addTask) {
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
                    // If creation fails, we might still want to consider it "handled" to avoid loop, 
                    // but for now let's say allCreated is preserved as true if it was an error vs skip?
                    // actually, if it errors, we probably want to try again? 
                    // But for the purpose of the UI button, if we skipped it because it wasn't auto-create, that's false.
                }
            } else if (!taskDef.isAutoCreate) {
                // If we skipped it because it wasn't auto-create (and not forced), then we haven't created everything
                allCreated = false;
            }
        }
        return allCreated;
    }

    static updateTaskTitle(taskId: string, newTitle: string) {
        if (PluginService.api.updateTask) {
            PluginService.api.updateTask(taskId, { title: newTitle });
            PluginService.log.info(`Updated task title to: ${newTitle}`);
        }
    }
}
