import { QuestArcState } from '../../types/state';
import {
    XP_PER_LEVEL_MULTIPLIER,
    PET_EVOLUTION_LEVEL_INTERVAL,
    PET_MAX_STAGE,
} from '../constants';

/**
 * Updates the player's XP and handles level-ups and pet evolution
 * @param currentState - The current game state
 * @param amount - Amount of XP to add
 * @returns An object containing the updated state and whether a level-up occurred
 * @remarks Automatically handles multiple level-ups and pet evolution at configured intervals.
 * Creates a new state object without mutating the input.
 */
export function updateXp(currentState: QuestArcState, amount: number): { state: QuestArcState; leveledUp: boolean } {
    // Create a copy of the state to ensure immutability
    const newState = {
        ...currentState,
        profile: {
            ...currentState.profile,
            pet: { ...currentState.profile.pet }
        }
    };

    newState.profile.xp += amount;
    let leveledUp = false;

    while (newState.profile.xp >= newState.profile.xpToNextLevel) {
        newState.profile.xp -= newState.profile.xpToNextLevel;
        newState.profile.level += 1;
        newState.profile.xpToNextLevel = newState.profile.level * XP_PER_LEVEL_MULTIPLIER;

        // Pet evolution check
        if (newState.profile.level % PET_EVOLUTION_LEVEL_INTERVAL === 0) {
            if (newState.profile.pet.stage < PET_MAX_STAGE) {
                newState.profile.pet.stage += 1;
            }
        }

        leveledUp = true;
    }

    return { state: newState, leveledUp };
}
