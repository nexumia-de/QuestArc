import { QuestArcState } from '../../types/state';
import {
    INITIAL_LEVEL,
    INITIAL_XP,


    PET_INITIAL_STAGE,
    XP_PER_LEVEL_MULTIPLIER
} from '../constants';
import { INITIAL_STATE, CURRENT_STATE_VERSION, STARTING_HP, STARTING_MAX_HP } from './config';



/**
 * Creates a fresh copy of the initial game state
 * @returns A new QuestArcState object with default values
 */
export function createInitialState(): QuestArcState {
    return JSON.parse(JSON.stringify(INITIAL_STATE));
}

/**
 * Migrates state from older versions to the current version
 * @param state - The state object to migrate (may be from an older version)
 * @returns A new state object migrated to the current version
 * @remarks Creates a deep copy to avoid mutating the input
 */
export function migrateState(state: any): QuestArcState {
    // If no version, it's version 0 (legacy)
    const version = state.version || 0;

    if (version === CURRENT_STATE_VERSION) {
        return state as QuestArcState;
    }

    // Create a deep copy to avoid mutating the input
    const newState = JSON.parse(JSON.stringify(state));

    // Migration from version 0 to 1
    if (version === 0) {
        newState.version = 1;
        // Add any migrations needed for v1
    }

    return newState as QuestArcState;
}

/**
 * Ensures the state object has all required fields with default values
 * @param state - The state object to validate and fill
 * @returns A complete state object with all required fields
 * @remarks Adds missing fields like HP, pet, and story data. Creates a deep copy to avoid mutations.
 */
export function ensureState(state: any): QuestArcState {
    // Create a deep copy to avoid mutating the input
    const newState = JSON.parse(JSON.stringify(state));

    if (!newState.profile) {
        newState.profile = {
            level: INITIAL_LEVEL,
            xp: INITIAL_XP,
            xpToNextLevel: INITIAL_LEVEL * XP_PER_LEVEL_MULTIPLIER,
            hp: STARTING_HP,
            maxHp: STARTING_MAX_HP

        };
    }
    if (!newState.profile.hp) newState.profile.hp = STARTING_HP;
    if (!newState.profile.maxHp) newState.profile.maxHp = STARTING_MAX_HP;

    if (!newState.profile.pet) {
        newState.profile.pet = { type: 'slime', stage: PET_INITIAL_STAGE, name: 'Buddy' };
    }
    if (!newState.profile.avatar) {
        newState.profile.avatar = {
            skinColor: '#ffe4c4',
            bgColor: '#e0e7ff',
            eyes: 'neutral',
            mouth: 'neutral'
        };
    }

    // Ensure activeStory exists with null values for template-only system
    if (!newState.activeStory) {
        newState.activeStory = {
            id: null,
            currentStepId: 0,
            taskProgress: {}
        };
    }

    // Ensure taskProgress exists for existing states (Migration)
    if (newState.activeStory && !newState.activeStory.taskProgress) {
        newState.activeStory.taskProgress = {};
    }

    // Cleanup old fields
    if (newState.activeStory) {
        if ('streakProgress' in newState.activeStory) {
            delete (newState.activeStory as any).streakProgress;
        }
    }

    // Clean up old fields from previous state structure
    if (newState.activeStory) {
        delete (newState.activeStory as any).title;
        delete (newState.activeStory as any).steps;
    }

    // Ensure settings exist
    if (!newState.settings) {
        newState.settings = {
            customTags: []
        };
    }

    // Ensure #questarc system tag exists
    const systemTag = newState.settings.customTags.find((t: any) => t.tag === '#questarc');
    if (!systemTag) {
        newState.settings.customTags.push({
            id: 'sys_questarc',
            tag: '#questarc',
            damage: 10,
            isSystem: true
        });
    }

    return newState as QuestArcState;
}
