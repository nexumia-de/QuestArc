import { PluginService } from '../services/PluginService';
import { QuestArcState } from '../types/state';
import { NoteParser } from '../lib/parsers/NoteParser';
import { Task } from '../types/plugin-api';

export interface UndoAction {
    id: string;
    timestamp: number;
    type: 'BOSS_DAMAGE' | 'TASK_COMPLETE';
    payload: any;
    description: string;
}

export class UndoService {
    /**
     * Logs an undoable action to the Root Task's notes.
     */
    static async logAction(rootTaskId: string, action: UndoAction): Promise<void> {
        try {
            const allTasks = await PluginService.api.getTasks();
            const rootTask = allTasks.find(t => t.id === rootTaskId);

            if (!rootTask) return;

            const noteJson = NoteParser.parse(rootTask.notes) || { meta: {} };
            // Force cast to any to avoid strict type issues during transition
            const data = noteJson as any;

            if (!data.undoHistory) {
                data.undoHistory = [];
            }

            data.undoHistory.push(action);

            // Limit history size (e.g., last 10 actions)
            if (data.undoHistory.length > 10) {
                data.undoHistory.shift();
            }

            await PluginService.api.updateTask(rootTaskId, {
                notes: `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
            });

            PluginService.log.info(`[UndoService] Logged action: ${action.description}`);

        } catch (e) {
            PluginService.log.error('[UndoService] Failed to log action', e);
        }
    }

    /**
     * Reverts the last action from the active quest's root task.
     */
    /**
     * Reverts the last action from the active quest's root task.
     * Returns the Modified state.
     */
    static async undoLastAction(state: QuestArcState): Promise<QuestArcState> {
        if (!state.activeStory.id) return state;

        try {
            // 1. Find the root task of the current quest
            const allTasks = await PluginService.api.getTasks();
            const rootTask = allTasks.find(t => t.id === state.activeStory.id);
            if (!rootTask) return state;

            // 2. Parse History
            const noteJson = NoteParser.parse(rootTask.notes);
            if (!noteJson) return state; // No history to undo

            // Force cast
            const data = noteJson as any;
            if (!data.undoHistory || data.undoHistory.length === 0) {
                PluginService.log.info('[UndoService] No history to undo.');
                return state;
            }

            // 3. Pop Last Action
            const lastAction = data.undoHistory.pop();

            // 4. Revert State Effect
            let newState = { ...state };

            if (lastAction.type === 'BOSS_DAMAGE') {
                const { previousHp } = lastAction.payload;
                if (newState.activeBoss && typeof previousHp === 'number') {
                    newState.activeBoss = {
                        ...newState.activeBoss,
                        hp: previousHp,
                        isDead: previousHp === 0
                    };
                    PluginService.log.info(`[UndoService] Reverted Boss HP to ${previousHp}`);
                }
            }
            // Add other undo types here if needed (e.g. XP reversal)

            // 5. Update Task Notes (Remove the history item)
            await PluginService.api.updateTask(rootTask.id, {
                notes: `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
            });

            return newState;

        } catch (e) {
            PluginService.log.error('[UndoService] Failed to undo action', e);
            return state;
        }
    }
}
