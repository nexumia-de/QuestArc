import { Task } from '../types/plugin-api';
import { compileTaskData } from '../lib/parsers';

// We rely on the global PluginAPI object provided by the host
// In tests, this will be mocked.

export class CompilerService {
    /**
     * Clones a template project into an active quest project.
     * @param templateProjectId The ID of the template project to clone.
     * @returns The ID of the newly created Active Project.
     */
    static async compileQuest(templateProjectId: string): Promise<string> {
        const projects = await PluginAPI.getAllProjects();
        const templateProject = projects.find(p => p.id === templateProjectId);

        if (!templateProject) {
            throw new Error(`Template project with ID ${templateProjectId} not found.`);
        }

        // 1. Create the new Active Project
        const newTitle = `${templateProject.title.replace('📜', '').trim()} 🧭`;
        const newProjectId = await PluginAPI.addProject({
            title: newTitle,
        });

        // 2. Fetch all tasks from the template project
        const allTasks = await PluginAPI.getTasks();
        const templateTasks = allTasks.filter(t => t.projectId === templateProjectId);

        // We need to maintain the hierarchy. 
        // SP returns a flat list, but tasks have `parentId` and `subTaskIds`.
        // We should clone top-level tasks first, then their children.
        const topLevelTasks = templateTasks.filter(t => !t.parentId);

        for (const task of topLevelTasks) {
            await this.cloneTaskRecursively(task, newProjectId, undefined, allTasks);
        }

        return newProjectId;
    }

    /**
     * Recursively clones a task and its subtasks.
     */
    private static async cloneTaskRecursively(
        originalTask: Task,
        targetProjectId: string,
        newParentId: string | undefined,
        allTasks: Task[]
    ): Promise<void> {
        // 1. Compile Data (Sanitize Title + Inject JSON)
        const { title: cleanTitle, data: questData } = compileTaskData(originalTask.title);

        // 2. Append QUEST_DATA to notes
        const originalNotes = originalTask.notes || '';
        const injection = `\n\n\`\`\`json\n${JSON.stringify({ QUEST_DATA: questData }, null, 2)}\n\`\`\``;
        const newNotes = originalNotes + injection;

        // 3. Create the new task
        const newTaskId = await PluginAPI.addTask({
            title: cleanTitle,
            projectId: targetProjectId,
            parentId: newParentId,
            notes: newNotes,
            tagIds: originalTask.tagIds || [], // Preserve tags
        });

        // 4. Handle Subtasks
        if (originalTask.subTaskIds && originalTask.subTaskIds.length > 0) {
            // Find tasks in allTasks whose ID is in subTaskIds
            const subTasks = allTasks.filter(t => originalTask.subTaskIds?.includes(t.id));
            for (const subTask of subTasks) {
                await this.cloneTaskRecursively(subTask, targetProjectId, newTaskId, allTasks);
            }
        }
    }
}
