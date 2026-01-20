import { compileTaskData } from '../lib/parsers';
import { Task } from '../types/plugin-api';

export class CompilerService {
    /**
     * Compiles a Quest Template into a new Active Quest.
     * @param templateProjectId The ID of the template project (starts with 📜)
     * @returns The ID of the newly created active project
     */
    static async compileQuest(templateProjectId: string): Promise<string> {
        // 1. Fetch Template Data
        const projects = await PluginAPI.getAllProjects();
        const template = projects.find(p => p.id === templateProjectId);
        if (!template) throw new Error(`Template not found: ${templateProjectId}`);

        // 2. Create New Project
        // "📜 My Quest" -> "My Quest 🧭"
        const coreTitle = template.title.replace(/^📜\s*/, '').trim();
        const newTitle = `${coreTitle} 🧭`;

        // Use the template's icon, or default to 🏹 if missing (though scanner guarantees 🏹 usually)
        const newIcon = template.icon || '🏹';

        const newProjectId = await PluginAPI.addProject({
            title: newTitle,
            icon: newIcon
        });

        // 3. Fetch Tasks from Template
        // Fallback: fetch all tasks and filter if specific API is missing
        const allTasks = await PluginAPI.getTasks();
        const templateTasks = allTasks.filter(t => t.projectId === templateProjectId);

        // 4. Clone Tasks (Root level first)
        const rootTasks = templateTasks.filter(t => !t.parentId);

        // SEQUENTIAL LOADING: Just clone the first one
        if (rootTasks.length > 0 && rootTasks[0]) {
            // Pass index 0 explicitly
            await this.cloneTask(rootTasks[0], newProjectId, templateTasks, null, 0);
        }

        return newProjectId;
    }

    /**
     * Clones the next task in the sequence from the template.
     * @param templateProjectId The ID of the source template
     * @param activeProjectId The ID of the active quest project
     * @param targetIndex The index of the task to load (from source)
     */
    static async compileNextTask(templateProjectId: string, activeProjectId: string, targetIndex: number): Promise<boolean> {
        // 1. Fetch Template Tasks again
        const allTasks = await PluginAPI.getTasks();
        const templateTasks = allTasks.filter(t => t.projectId === templateProjectId);
        const rootTasks = templateTasks.filter(t => !t.parentId);

        // 2. Identify Next Task
        // We use the explicit targetIndex
        if (targetIndex >= rootTasks.length) {
            return false; // No more tasks
        }

        const nextTask = rootTasks[targetIndex];

        // 3. Clone it
        await this.cloneTask(nextTask, activeProjectId, templateTasks, null, targetIndex);
        return true;
    }

    /**
     * Recursively clones a task and its subtasks.
     */
    private static async cloneTask(
        originalTask: Task,
        targetProjectId: string,
        allTemplateTasks: Task[],
        parentId: string | null = null,
        sourceIndex?: number
    ) {
        // Parse special syntax (e.g. [XP:100]) using our parsers
        const { title: cleanTitle, data } = compileTaskData(originalTask.title);

        // Inject sourceIndex if provided
        if (sourceIndex !== undefined) {
            data.meta.sourceIndex = sourceIndex;
        }

        // Serialize QuestData into notes
        // We preserve original notes if they exist, but append our system data block
        const noteContent = originalTask.notes || '';
        const systemDataBlock = `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

        // If notes already have JSON, we might want to be careful, but for templates, 
        // we assume the template builder used clean notes or raw text.
        // Let's just append.
        const finalNotes = noteContent ? `${noteContent}\n\n${systemDataBlock}` : systemDataBlock;

        const newTaskId = await PluginAPI.addTask({
            title: cleanTitle,
            notes: finalNotes,
            projectId: targetProjectId,
            parentId: parentId || undefined
        });

        // Clone subtasks
        if (originalTask.subTaskIds && originalTask.subTaskIds.length > 0) {
            // Match IDs (assuming string IDs)
            const subTasks = allTemplateTasks.filter(t => originalTask.subTaskIds?.includes(t.id));
            for (const sub of subTasks) {
                // Subtasks don't need sourceIndex logic for sequential loading (as they load with parent)
                await this.cloneTask(sub, targetProjectId, allTemplateTasks, newTaskId);
            }
        }
    }
}
