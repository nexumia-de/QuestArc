import { QuestArcState } from '../../types/state';

export class XpLogic {
    static checkLevelUp(state: QuestArcState): { newState: QuestArcState; leveledUp: boolean } {
        let newState = { ...state };
        let leveledUp = false;

        const MAX_LOOPS = 100;
        let loopCount = 0;

        while (newState.profile.xp >= newState.profile.xpToNextLevel && loopCount < MAX_LOOPS) {
            newState.profile.xp -= newState.profile.xpToNextLevel;
            newState.profile.level += 1;
            // Ensure xpToNextLevel grows and doesn't get stuck
            const nextXp = Math.floor(newState.profile.xpToNextLevel * 1.5);
            newState.profile.xpToNextLevel = Math.max(10, nextXp);
            leveledUp = true;
            loopCount++;
        }

        if (loopCount >= MAX_LOOPS) {
            console.warn('[XpLogic] Infinite loop detected in level up calculation. Aborting.');
        }
        return { newState, leveledUp };
    }
}
