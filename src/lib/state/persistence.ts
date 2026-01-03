import { QuestArcState, HeroStory } from '../../types/state';
import storyDataRaw from '../../assets/stories/productivity-mastery.json';
import {
    INITIAL_LEVEL,
    INITIAL_XP,
    INITIAL_HP,
    INITIAL_MAX_HP,
    PET_INITIAL_STAGE,
    XP_PER_LEVEL_MULTIPLIER
} from '../constants';
import { INITIAL_STATE, CURRENT_STATE_VERSION } from './config';

const STORY_DATA = storyDataRaw as HeroStory;

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
            hp: INITIAL_HP,
            maxHp: INITIAL_MAX_HP
        };
    }
    if (!newState.profile.hp) newState.profile.hp = INITIAL_HP;
    if (!newState.profile.maxHp) newState.profile.maxHp = INITIAL_MAX_HP;
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

    if (!newState.stories || !Array.isArray(newState.stories)) {
        newState.stories = [STORY_DATA];
    }

    if (!newState.completedStories || !Array.isArray(newState.completedStories)) {
        newState.completedStories = [];
    }

    // Ensure activeStory exists
    if (!newState.activeStory) {
        newState.activeStory = {
            id: STORY_DATA.id,
            currentStepId: 1,
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

    return newState as QuestArcState;
}
