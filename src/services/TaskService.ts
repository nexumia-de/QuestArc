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



}

function prepareTaskPayload(taskDef: any, stepTitle: string | undefined, projectId?: string | null): any {
    const sTitle = stepTitle || 'Quest Step';
    const additionalFields: any = {
        notes: taskDef.notes || `Quest Sub-task for: ${sTitle}`
    };

    if (projectId) {
        additionalFields.projectId = projectId;
    }


    return {
        title: `${taskDef.title} #QuestArc`,
        ...additionalFields
    };
}
