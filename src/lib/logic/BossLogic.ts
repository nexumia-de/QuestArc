import { QuestArcState } from '../../types/state';
import { StoryStep } from '../../types/state';

export class BossLogic {
    static initializeBossIfNeeded(state: QuestArcState, currentStep: StoryStep): QuestArcState {
        if (
            currentStep.completion.type === 'boss_defeat' &&
            !state.activeBoss &&
            currentStep.completion.config?.boss
        ) {
            return {
                ...state,
                activeBoss: { ...currentStep.completion.config.boss, isDead: false }
            };
        }
        return state;
    }

    static applyDamage(state: QuestArcState, amount: number): { newState: QuestArcState; damageDealt: number; killed: boolean } {
        if (amount <= 0 || !state.activeBoss || state.activeBoss.isDead) {
            return { newState: state, damageDealt: 0, killed: false };
        }

        let damageDealt = amount;
        let killed = false;
        const newHp = Math.max(0, state.activeBoss.hp - damageDealt);

        const newState = {
            ...state,
            activeBoss: {
                ...state.activeBoss,
                hp: newHp,
                isDead: newHp === 0
            }
        };

        if (newHp === 0) {
            killed = true;
        }
        return { newState, damageDealt, killed };
    }
}
