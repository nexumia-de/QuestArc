import { Task } from '@super-productivity/plugin-api';
import { QuestArcState } from '../types/state';
import { PluginService } from '../services/PluginService';
import { getCurrentStep } from '../lib/state-manager';

export class TaskUndoHandler {
    static async handle(state: QuestArcState, task: Task, saveCallback: (newState: QuestArcState) => Promise<void>) {
        PluginService.log.info('Checking if undo is possible for task:', task.title);

        const currentStep = getCurrentStep(state);

        if (!state.activeBoss && !currentStep) {
            PluginService.log.info('No active boss or step, nothing to undo.');
            return;
        }

        // 1. Check if we have progress for this task to undo
        const currentProgress = state.activeStory.taskProgress[task.title] || 0;

        if (currentProgress <= 0) {
            PluginService.log.info('No progress recorded for this task. It might have been completed in a previous step or not counted.');
            return;
        }

        PluginService.log.info(`Found progress (${currentProgress}) for task. Undoing...`);

        let newState = { ...state };

        // 2. Decrement Progress
        newState.activeStory.taskProgress = {
            ...newState.activeStory.taskProgress,
            [task.title]: currentProgress - 1
        };

        // 3. Revert Boss Damage (if applicable)
        if (state.activeBoss) {
            const HEAL_AMOUNT = 10;

            const oldHp = state.activeBoss.hp;
            const maxHp = state.activeBoss.maxHp;
            const newHp = Math.min(maxHp, oldHp + HEAL_AMOUNT);

            newState.activeBoss = {
                ...state.activeBoss,
                hp: newHp
            };

            PluginService.log.info(`Healed boss for ${newHp - oldHp} HP (Current: ${newHp}/${maxHp})`);
            PluginService.showSnack(`Undid task. Boss healed: ${newHp - oldHp} HP`, 'SUCCESS');
        } else {
            PluginService.showSnack(`Undid task progress: ${task.title}`, 'SUCCESS');
        }

        await saveCallback(newState);
    }
}
