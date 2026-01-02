import { QuestArcState, HeroStory, StoryStep } from '../types/state';
import storyDataRaw from '../assets/stories/productivity-mastery.json';
import {
  XP_PER_LEVEL_MULTIPLIER,
  INITIAL_LEVEL,
  INITIAL_XP,
  INITIAL_HP,
  INITIAL_MAX_HP,
  PET_INITIAL_STAGE,
  PET_EVOLUTION_LEVEL_INTERVAL,
  PET_MAX_STAGE,
} from './constants';
import { logger } from './logger';

const STORY_DATA = storyDataRaw as HeroStory;

export const CURRENT_STATE_VERSION = 1;

export const INITIAL_STATE: QuestArcState = {
  version: CURRENT_STATE_VERSION,
  profile: {
    level: INITIAL_LEVEL,
    xp: INITIAL_XP,
    xpToNextLevel: INITIAL_LEVEL * XP_PER_LEVEL_MULTIPLIER,
    hp: INITIAL_HP,
    maxHp: INITIAL_MAX_HP,
    pet: {
      type: 'slime',
      stage: PET_INITIAL_STAGE,
      name: 'Buddy',
    },
  },
  stories: [STORY_DATA],
  activeStory: {
    id: STORY_DATA.id,
    currentStepId: 1,
    streakProgress: 0,
    taskProgress: {}
  },
  activeBoss: null,
};

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

  // Future migrations would go here
  // if (version === 1) { newState.version = 2; ... }

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

  if (!newState.stories || !Array.isArray(newState.stories)) {
    newState.stories = [STORY_DATA];
  }

  // Ensure activeStory exists
  if (!newState.activeStory) {
    newState.activeStory = {
      id: STORY_DATA.id,
      currentStepId: 1,
      streakProgress: 0,
      taskProgress: {}
    };
  }

  // Clean up old fields from previous state structure
  if (newState.activeStory) {
    delete (newState.activeStory as any).title;
    delete (newState.activeStory as any).steps;
  }

  return newState as QuestArcState;
}

/**
 * Retrieves the currently active story from the state
 * @param state - The game state
 * @returns The active story object, or undefined if not found
 * @remarks Logs a warning if the active story ID doesn't exist in the stories array
 */
export function getActiveStory(state: QuestArcState): HeroStory | undefined {
  const story = state.stories.find(s => s.id === state.activeStory.id);

  if (!story) {
    logger.warn(`Active story not found: ${state.activeStory.id}`);
  }

  return story;
}

/**
 * Gets the current step of the active story with validation and fallback
 * @param state - The game state
 * @returns The current step, or undefined if story/steps don't exist
 * @remarks Falls back to the first step if the current step ID is invalid. Logs warnings for validation failures.
 */
export function getCurrentStep(state: QuestArcState): StoryStep | undefined {
  const activeStory = getActiveStory(state);

  if (!activeStory) {
    logger.warn('No active story found');
    return undefined;
  }

  if (!activeStory.steps || activeStory.steps.length === 0) {
    logger.warn(`Active story ${activeStory.id} has no steps`);
    return undefined;
  }

  const step = activeStory.steps.find(s => s.id === state.activeStory.currentStepId);

  if (!step) {
    logger.warn(
      `Step ${state.activeStory.currentStepId} not found in story ${activeStory.id}. ` +
      `Falling back to first step.`
    );
    // Fallback to first step to prevent complete failure
    return activeStory.steps[0];
  }

  return step;
}

/**
 * Gets the title of the current step with a fallback
 * @param state - The game state
 * @returns The current step title, or a formatted version of the story ID if step not found
 */
export function getCurrentStepTitle(state: QuestArcState): string {
  const currentStep = getCurrentStep(state);
  if (currentStep?.title) {
    return currentStep.title;
  }
  return state.activeStory.id.replace(/_/g, ' ').toUpperCase();
}

/**
 * Validates that a state object has the required structure
 * @param state - The state object to validate
 * @returns True if the state has all required fields, false otherwise
 * @remarks Checks for presence of profile, activeStory, and required numeric fields
 */
export function validateState(state: any): boolean {
  if (!state || typeof state !== 'object') {
    return false;
  }

  return Boolean(
    state.profile &&
    state.activeStory &&
    typeof state.profile.level === 'number' &&
    typeof state.profile.xp === 'number'
  );
}

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
