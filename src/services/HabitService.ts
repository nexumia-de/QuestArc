import { PluginService } from './PluginService';
import { CronHelper } from '../lib/cron';
import { Task } from '../types/plugin-api';
import { cleanTaskTitle, formatTaskTitle } from '../lib/parsers';

const GRIMOIRE_PROJECT_TITLE = 'QuestArc Grimoire';
const GRIMOIRE_ICON = '📖'; // Book icon for the project
const INBOX_TASK_TITLE = 'Inbox';
const INBOX_ICON = '📥';

export class HabitService {

    /**
     * Persists a completed challenge task as a long-term habit in the Grimoire.
     */
    static async persistHabit(task: Task, originStoryTitle: string) {
        PluginService.log.info(`[HabitService] Persisting habit from task: "${task.title}"`);

        try {
            // 1. Ensure Grimoire Project Exists (Restored Logic)
            const projectId = await this.ensureGrimoireProject();
            if (!projectId) throw new Error('Failed to ensure Grimoire project');

            // 2. Resolve Target Parent (Inbox vs Custom Group)
            let targetGroup = 'Inbox';
            let parsedMeta: any = {};
            let shouldPersist = false;

            // Check JSON meta first (Upstream parsing preferred)
            try {
                const match = (task.notes || '').match(/```json\s*([\s\S]*?)\s*```/);
                if (match && match[1]) {
                    parsedMeta = JSON.parse(match[1]).meta || {};
                    if (parsedMeta.persistent) {
                        shouldPersist = true;
                        if (typeof parsedMeta.persistent === 'string') {
                            targetGroup = parsedMeta.persistent.trim();
                        } else {
                            targetGroup = 'Inbox';
                        }
                    }
                }
            } catch (e) { /* ignore */ }

            // Fallback Check: [persistent:NAME] in title (legacy support)
            if (!shouldPersist) {
                const persistentMatch = task.title.match(/\[persistent:(.*?)\]/) || (task.notes || '').match(/\[persistent:(.*?)\]/);
                if (persistentMatch) {
                    shouldPersist = true;
                    if (persistentMatch[1]) {
                        targetGroup = persistentMatch[1].trim();
                    }
                }
            }

            if (!shouldPersist) {
                PluginService.log.info(`[HabitService] Task "${task.title}" is not marked as persistent. Skipping.`);
                return;
            }

            const parentId = await this.ensureParentTask(projectId, targetGroup);

            // 3. Prepare New Task Data
            // Strip challenge-specific tags from title
            let newTitle = task.title
                .replace(/\[persistent(:.*?)?\]/g, '') // Remove persistent tag
                .replace(/\[count:.*?\]/g, '')         // Remove count limit (infinite habit)
                .replace(/\[streak:.*?\]/g, '')        // Remove streak challenge (infinite habit)
                .trim();

            // Clean up double spaces
            newTitle = newTitle.replace(/\s+/g, ' ');

            // --- DUPLICATE CHECK ---
            // Check if this task already exists in the target group (parentId)
            const allTasks = await PluginService.api.getTasks();
            const existingDuplicate = allTasks.find(t =>
                t.parentId === parentId &&
                t.title.trim() === newTitle
            );

            if (existingDuplicate) {
                PluginService.log.info(`[HabitService] Duplicate habit found in "${targetGroup}". Skipping persistence. (Task: "${newTitle}")`);
                return;
            }

            // Create the new task
            const newTask = await PluginService.api.addTask({
                title: newTitle,
                projectId: projectId,
                parentId: parentId,
            });

            // 4. Clean JSON Data & Calculate Title/State
            let finalNotes = task.notes || '';
            let isDoneInitial = false;
            let titleFromData = newTitle; // Fallback

            try {
                const match = finalNotes.match(/```json\s*([\s\S]*?)\s*```/);
                if (match && match[1]) {
                    const data = JSON.parse(match[1]);

                    // Modify Meta: Remove count/persistent tags from meta if present
                    if (data.meta) {
                        delete data.meta.count;
                        delete data.meta.persistent;
                    }

                    // Modify Progress: 
                    // Ensure progress object exists (Robustness fix)
                    if (!data.progress) {
                        data.progress = { current: 0, target: 1 };
                    }

                    if (data.progress) {
                        // Remove Streak Target (Make infinite)
                        if (data.progress.streak) {
                            delete data.progress.streak.target;
                        } else {
                            // "If freq daily automatically use streak:1 as goal" (Robustness fix)
                            // Check if frequency is daily
                            const isDaily = (data.routine && data.routine.frequency === 'daily') ||
                                task.title.includes('[freq:daily]');

                            if (isDaily) {
                                data.progress.streak = {
                                    current: 1, // We just finished it today
                                    highest: 1,
                                    target: 1 // As requested
                                };
                            }
                        }

                        // Do NOT remove data.progress.target (Daily Goal)
                        // But ensure we check status.

                        // Check if done
                        const current = data.progress.current || 0;
                        const target = data.progress.target || 1;
                        if (current >= target) {
                            isDoneInitial = true;
                        }
                    }

                    // Re-serialize
                    // SYNC FREQUENCY: If title has [freq:...] tag, update JSON (Source of Truth)
                    // Match parser logic: [freq:...] or [freq ...] or [freq] (though simple [freq] is daily)
                    const freqRegex = /\[freq(?::(.*?))?\]/i;
                    const freqMatch = task.title.match(freqRegex) || (task.notes || '').match(freqRegex);
                    if (freqMatch && freqMatch[1]) {
                        const titleFreq = freqMatch[1].trim();
                        // If empty (just [freq]), default is daily. If contains value, use it.
                        if (titleFreq) {
                            if (!data.routine) data.routine = {};
                            data.routine.frequency = titleFreq;
                        }
                    }

                    const newJson = JSON.stringify(data, null, 2);
                    // Replace the JSON block in notes
                    finalNotes = finalNotes.replace(match[0], `\`\`\`json\n${newJson}\n\`\`\``);

                    // REGENERATE TITLE using the fresh data
                    // 1. Clean base title (remove existing stats/tags)
                    let baseTitle = cleanTaskTitle(newTitle);
                    // Remove remaining tags we stripped earlier just to be safe
                    baseTitle = baseTitle
                        .replace(/\[persistent(:.*?)?\]/g, '')
                        .replace(/\[count:.*?\]/g, '')
                        .replace(/\[streak:.*?\]/g, '')
                        // Clean both old and new Next tags to be safe
                        .replace(/\s*\[\s*(Next|Due):.*?\]/gi, '')
                        .trim();

                    // 2. Format with new stats
                    titleFromData = formatTaskTitle(baseTitle, data.progress);

                    // 3. Add [Next: Day Time] tag using CronHelper (Matches StreakLogic)
                    const freqExpression = (data.routine && data.routine.frequency) ? data.routine.frequency : 'daily';
                    const now = Date.now();
                    const nextMs = CronHelper.getNextOccurrence(freqExpression, now);

                    if (nextMs) {
                        const nextDate = new Date(nextMs);
                        const timeStr = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dayStr = nextDate.toLocaleDateString([], { weekday: 'short' });
                        titleFromData += ` [Next: ${dayStr} ${timeStr}]`;
                    }

                    // Force isDone to FALSE (Per user request: "shouldnt never be ticked fully")
                    // The task stays open, acting as a recurring counter.
                    isDoneInitial = false;
                }
            } catch (e) {
                PluginService.log.warn('[HabitService] Failed to clean task JSON', e);
            }

            const backlinkNote = `> **Graduated from Quest**: ${originStoryTitle}\n> **Date**: ${new Date().toLocaleDateString()}\n\n${finalNotes}`;

            await PluginService.api.updateTask(newTask, {
                title: titleFromData, // Update with correct stats + [next]
                notes: backlinkNote,
                tagIds: task.tagIds, // Copy tags
                isDone: isDoneInitial // Always false
            });

            PluginService.log.info(`[HabitService] Successfully persisted habit "${newTitle}" to "${targetGroup}"`);
            PluginService.showSnack(`📖 Added "${newTitle}" to your Grimoire (${targetGroup})`, 'SUCCESS');

        } catch (e) {
            PluginService.log.error('[HabitService] Failed to persist habit', e);
            PluginService.showSnack('Failed to save habit to Grimoire', 'ERROR');
        }
    }

    private static async ensureGrimoireProject(): Promise<string | null> {
        const projects = await PluginService.api.getAllProjects();
        const existing = projects.find(p => p.title.includes(GRIMOIRE_PROJECT_TITLE));

        if (existing) return existing.id;

        // Create new
        const newProject = await PluginService.api.addProject({
            title: `${GRIMOIRE_ICON} ${GRIMOIRE_PROJECT_TITLE}`,
            // theme property might not be supported in Partial<Project> if not defined in types, checking...
            // defined in types as optional.
        });

        return newProject;
    }

    private static async ensureParentTask(projectId: string, groupName: string): Promise<string> {
        const tasks = await PluginService.api.getTasks();
        // Filter tasks in this project
        const projectTasks = tasks.filter(t => t.projectId === projectId);

        // precise match
        const existing = projectTasks.find(t => t.title.trim() === groupName);

        if (existing) return existing.id;

        // Create new Group Task
        // If it's Inbox, add icon
        const title = groupName === 'Inbox' ? `${INBOX_ICON} ${INBOX_TASK_TITLE}` : groupName;

        const newTask = await PluginService.api.addTask({
            title: title,
            projectId: projectId,
        });

        return newTask;
    }
}
