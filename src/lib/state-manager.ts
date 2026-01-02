import { QuestArcState, HeroStory, StoryStep } from '../types/state';
import storyDataRaw from '../assets/stories/productivity-mastery.json';

const STORY_DATA = storyDataRaw as HeroStory;

export const CURRENT_STATE_VERSION = 1;

export const INITIAL_STATE: QuestArcState = {
  version: CURRENT_STATE_VERSION,
  profile: {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: 100,
    maxHp: 100,
    pet: {
      type: 'slime',
      stage: 1,
      name: 'Buddy',
    },
  },
  stories: [STORY_DATA],
  activeStory: {
    id: STORY_DATA.id,
    currentStepId: 1,
    streakProgress: 0,
  },
  activeBoss: null,
};

export function createInitialState(): QuestArcState {
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

/**
 * Migrate state from older versions to current version
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
 * Ensures compatibility for runtime state
 */
export function ensureState(state: any): QuestArcState {
  // Create a deep copy to avoid mutating the input
  const newState = JSON.parse(JSON.stringify(state));

  if (!newState.profile) {
    newState.profile = { level: 1, xp: 0, xpToNextLevel: 100, hp: 100, maxHp: 100 };
  }
  if (!newState.profile.hp) newState.profile.hp = 100;
  if (!newState.profile.maxHp) newState.profile.maxHp = 100;
  if (!newState.profile.pet) {
    newState.profile.pet = { type: 'slime', stage: 1, name: 'Buddy' };
  }

  if (!newState.stories || !Array.isArray(newState.stories)) {
    newState.stories = [STORY_DATA];
  }

  // Ensure activeStory exists
  if (!newState.activeStory) {
    newState.activeStory = {
      id: STORY_DATA.id,
      currentStepId: 1,
      streakProgress: 0
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
 * Get the active story definition from state
 */
export function getActiveStory(state: QuestArcState): HeroStory | undefined {
  return state.stories.find(story => story.id === state.activeStory.id);
}

/**
 * Get the current step of the active story
 */
export function getCurrentStep(state: QuestArcState): StoryStep | undefined {
  const activeStory = getActiveStory(state);
  return activeStory?.steps.find(step => step.id === state.activeStory.currentStepId);
}

/**
 * Get the title of the current step, with fallback
 */
export function getCurrentStepTitle(state: QuestArcState): string {
  const currentStep = getCurrentStep(state);
  return currentStep?.title ?? state.activeStory.id.replace(/_/g, ' ').toUpperCase();
}

/**
 * Validate that state has required structure
 */
export function validateState(state: any): boolean {
  return (
    state &&
    typeof state === 'object' &&
    state.profile &&
    state.activeStory &&
    typeof state.profile.level === 'number' &&
    typeof state.profile.xp === 'number'
  );
}

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
    newState.profile.xpToNextLevel = newState.profile.level * 100;

    // Pet evolution check
    if (newState.profile.level % 5 === 0) {
      if (newState.profile.pet.stage < 3) {
        newState.profile.pet.stage += 1;
      }
    }

    leveledUp = true;
  }

  return { state: newState, leveledUp };
}
