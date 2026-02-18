import { compileTaskData, cleanTaskTitle } from '../lib/parsers';
import { Task } from '../types/plugin-api';
import { PluginService } from './PluginService';
import { NoteParser } from '../lib/parsers/NoteParser';
import { QuestTaskData } from '../types/quest-v2';
import { CronHelper } from '../lib/cron';

export class CompilerService {
    /**
     * Compiles a Quest Template into a new Active Quest.
     * @param templateProjectId The ID of the template project (starts with 📜)
     * @returns The ID of the newly created active project
     */
    static async compileQuest(templateProjectId: string): Promise<string> {
        // 1. Fetch Template Data
        const projects = await PluginService.api.getAllProjects();
        const template = projects.find(p => p.id === templateProjectId);
        if (!template) throw new Error(`Template not found: ${templateProjectId}`);

        // 2. Create New Project
        // "📜 My Quest" -> "My Quest 🧭"
        const coreTitle = template.title.replace(/^📜\s*/, '').trim();
        const newTitle = `${coreTitle} 🧭`;

        // Use the template's icon, or default to 🏹 if missing (though scanner guarantees 🏹 usually)
        const newIcon = template.icon || '🏹';

        const newProjectId = await PluginService.api.addProject({
            title: newTitle,
            icon: newIcon
        });

        // 3. Fetch Tasks from Template
        // Fallback: fetch all tasks and filter if specific API is missing
        const allTasks = await PluginService.api.getTasks();
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
        const allTasks = await PluginService.api.getTasks();
        const templateTasks = allTasks.filter(t => t.projectId === templateProjectId);
        const rootTasks = templateTasks.filter(t => !t.parentId);

        // 2. Identify Next Task
        // We use the explicit targetIndex
        if (targetIndex >= rootTasks.length) {
            return false; // No more tasks
        }

        const nextTask = rootTasks[targetIndex];
        if (!nextTask) return false;

        // 3. Build stack data from the *completing* step's habits
        const stackData = await this.extractStackData(activeProjectId, allTasks);

        // 4. Clone it (with stack data for streak injection)
        await this.cloneTask(nextTask, activeProjectId, templateTasks, null, targetIndex, stackData);
        return true;
    }

    /**
     * Extracts streak data from the most recently completing step's habit subtasks.
     * Returns a map of stackId -> streak/progress data for injection into the next step.
     */
    private static async extractStackData(
        activeProjectId: string,
        allTasks: Task[]
    ): Promise<Map<string, QuestTaskData['progress']>> {
        const stackMap = new Map<string, QuestTaskData['progress']>();

        // Find the active project's tasks
        const activeTasks = allTasks.filter(t => t.projectId === activeProjectId);

        // Find the most recent root task (the completing step)
        // It's the last root task in the project
        const rootTasks = activeTasks.filter(t => !t.parentId);
        const currentStep = rootTasks[rootTasks.length - 1];
        if (!currentStep) return stackMap;

        // Get its subtasks
        const subtasks = activeTasks.filter(t => t.parentId === currentStep.id);

        for (const sub of subtasks) {
            const json = NoteParser.parse(sub.notes);
            if (!json?.meta?.stack || json.meta.type !== 'HABIT') continue;

            const stackId = json.meta.stack;
            if (json.progress) {
                stackMap.set(stackId, {
                    // Carry over streak fields
                    current: 0, // Reset daily progress
                    target: json.progress.target, // Will be overwritten by new template
                    lastDoneDate: json.progress.lastDoneDate,
                    streak: json.progress.streak ? {
                        current: json.progress.streak.current ?? 0,
                        target: json.progress.streak.target, // Will be overwritten
                        highest: json.progress.streak.highest ?? 0,
                        tier: json.progress.streak.tier,
                        totalCompletions: json.progress.streak.totalCompletions ?? 0,
                        availableGrace: json.progress.streak.availableGrace,
                    } : undefined,
                });
                PluginService.log.info(`[Compiler] Stack data extracted for '${stackId}': streak ${json.progress.streak?.current ?? 0}`);
            }
        }

        return stackMap;
    }

    /**
     * Recursively clones a task and its subtasks.
     */
    private static async cloneTask(
        originalTask: Task,
        targetProjectId: string,
        allTemplateTasks: Task[],
        parentId: string | null = null,
        sourceIndex?: number,
        stackData?: Map<string, QuestTaskData['progress']>
    ) {
        // Parse special syntax (e.g. [XP:100]) using our parsers
        let { title: cleanTitle, data } = compileTaskData(originalTask.title);
        let isDone = false;

        // Inject sourceIndex if provided
        if (sourceIndex !== undefined) {
            data.meta.sourceIndex = sourceIndex;
        }

        // Habit Stacking: Inject streak data from previous step
        if (stackData && data.meta.stack && data.meta.type === 'HABIT' && data.progress) {
            const oldProgress = stackData.get(data.meta.stack);
            if (oldProgress) {
                // Carry over streak history, but keep new template's targets
                const newStreakTarget = data.progress.streak?.target;
                const newProgressTarget = data.progress.target;

                data.progress.lastDoneDate = oldProgress.lastDoneDate;
                if (oldProgress.streak && data.progress.streak) {
                    data.progress.streak.current = oldProgress.streak.current ?? 0;
                    data.progress.streak.highest = oldProgress.streak.highest ?? 0;
                    data.progress.streak.tier = oldProgress.streak.tier;
                    data.progress.streak.totalCompletions = oldProgress.streak.totalCompletions ?? 0;
                    data.progress.streak.availableGrace = oldProgress.streak.availableGrace;
                    // Preserve new template's target
                    data.progress.streak.target = newStreakTarget;
                }
                // Keep new template's progress target, reset current to 0
                data.progress.target = newProgressTarget;
                data.progress.current = 0;

                PluginService.log.info(`[Compiler] Stacked '${data.meta.stack}': streak ${oldProgress.streak?.current ?? 0} -> new target ${newStreakTarget}`);

                // Regenerate title to reflect carried-over streak
                const baseTitle = cleanTaskTitle(cleanTitle);
                let newTitle = baseTitle;

                // Re-append count if needed
                if (data.progress.target && data.progress.target > 1) {
                    newTitle += ` (${data.progress.current}/${data.progress.target})`;
                }

                // Re-append streak
                if (data.progress.streak && data.progress.streak.target) {
                    newTitle += ` ${data.progress.streak.current}/${data.progress.streak.target} 🔥`;
                }

                // Check if task is "done" for this cycle based on lastDoneDate
                if (oldProgress.lastDoneDate) {
                    const freq = data.meta.frequency || 'daily';
                    const lastDoneTime = new Date(oldProgress.lastDoneDate).getTime();
                    const nextRun = CronHelper.getNextOccurrence(freq, lastDoneTime);

                    if (nextRun && nextRun > Date.now()) {
                        // Still in cooldown -> Mark as done
                        if (data.progress.target) {
                            data.progress.current = data.progress.target;
                            isDone = true;

                            // Update title count to match "done" state
                            newTitle = newTitle.replace(`(0/${data.progress.target})`, `(${data.progress.target}/${data.progress.target})`);
                        }

                        // Generate [Next: ...] tag
                        const nextDate = new Date(nextRun);
                        const timeStr = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const daysAway = (nextRun - Date.now()) / (1000 * 60 * 60 * 24);
                        let dateStr: string;
                        if (daysAway > 7) {
                            const day = nextDate.getDate().toString().padStart(2, '0');
                            const month = (nextDate.getMonth() + 1).toString().padStart(2, '0');
                            dateStr = `${day}.${month}.`;
                        } else {
                            dateStr = nextDate.toLocaleDateString([], { weekday: 'short' });
                        }
                        newTitle += ` [Next: ${dateStr} ${timeStr}]`;
                    }
                }

                cleanTitle = newTitle;
            }
        }

        // Serialize QuestData into notes
        // We preserve original notes if they exist, but append our system data block
        const noteContent = originalTask.notes || '';
        const systemDataBlock = `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

        // If notes already have JSON, we might want to be careful, but for templates, 
        // we assume the template builder used clean notes or raw text.
        // Let's just append.
        const finalNotes = noteContent ? `${noteContent}\n\n${systemDataBlock}` : systemDataBlock;

        // Only add #QuestArc tag if it is a root task (no parentId)
        const titleSuffix = parentId ? '' : ' #QuestArc';

        const newTaskId = await PluginService.api.addTask({
            title: `${cleanTitle}${titleSuffix}`,
            notes: finalNotes,
            projectId: targetProjectId,
            parentId: parentId || undefined,
            isDone: isDone
        });

        // Clone subtasks (pass stackData down for subtask habit matching)
        if (originalTask.subTaskIds && originalTask.subTaskIds.length > 0) {
            // Match IDs (assuming string IDs)
            const subTasks = allTemplateTasks.filter(t => originalTask.subTaskIds?.includes(t.id));
            for (const sub of subTasks) {
                // Subtasks don't need sourceIndex logic for sequential loading (as they load with parent)
                await this.cloneTask(sub, targetProjectId, allTemplateTasks, newTaskId, undefined, stackData);
            }
        }
    }
}
