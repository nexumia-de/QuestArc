import { Task } from '../../types/plugin-api';
import { QuestArcState } from '../../types/state';
import { PluginService } from '../../services/PluginService';
import { NoteParser } from '../parsers/NoteParser';
import { BossService } from '../../services/BossService';
import { TaskType } from '../../constants';

export interface ValidationResult {
    shouldBlock: boolean;
    reason?: string;
    uiMessage?: string;
}

export class TaskValidators {
    /**
     * Prevents manual completion of Boss tasks which should only be defeated via damage.
     */
    static validateBossGuard(task: Task): ValidationResult {
        // Check JSON type first
        const questData = NoteParser.parse(task.notes);
        const taskType = questData?.meta?.type;

        if (taskType === TaskType.BOSS) {
            const bossConfig = BossService.extractBossConfig(task);
            if (bossConfig && bossConfig.hp > 0) {
                PluginService.log.warn(`[TaskValidators] Blocked manual completion of Boss "${task.title}" (HP: ${bossConfig.hp})`);
                return {
                    shouldBlock: true,
                    reason: 'BOSS_MANUAL_COMPLETION',
                    uiMessage: '⛔ You cannot defeat the boss by clicking! Attack it with tasks!'
                };
            }
        }
        return { shouldBlock: false };
    }

    /**
     * Prevents completion of a parent task if it has open subtasks.
     * Only applies to tasks within the active Quest.
     */
    static async validateStructureGuard(task: Task, state: QuestArcState, api: typeof PluginService.api): Promise<ValidationResult> {
        if (state.activeStory.id && task.projectId === state.activeStory.id) {
            if (task.subTaskIds && task.subTaskIds.length > 0) {
                try {
                    const allTasks = await api.getTasks();
                    const openSubtasks = allTasks.filter(t => task.subTaskIds?.includes(t.id) && !t.isDone);

                    if (openSubtasks.length > 0) {
                        PluginService.log.warn(`[TaskValidators] Blocked parent completion. ${openSubtasks.length} subtasks open.`);
                        return {
                            shouldBlock: true,
                            reason: 'OPEN_SUBTASKS',
                            uiMessage: '⛔ [Quest] Step incomplete! Finish all subtasks first.'
                        };
                    }
                } catch (e) {
                    PluginService.log.error('[TaskValidators] Structure Guard Error', e);
                }
            }
        }
        return { shouldBlock: false };
    }
}
