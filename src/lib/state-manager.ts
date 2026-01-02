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

  // Migration from version 0 to 1
  if (version === 0) {
    state.version = 1;
    // Add any migrations needed for v1
  }

  // Future migrations would go here
  // if (version === 1) { state.version = 2; ... }

  return state as QuestArcState;
}

/**
 * Ensures compatibility for runtime state
 */
export function ensureState(state: any): QuestArcState {
  if (!state.profile) {
    state.profile = { level: 1, xp: 0, xpToNextLevel: 100, hp: 100, maxHp: 100 };
  }
  if (!state.profile.hp) state.profile.hp = 100;
  if (!state.profile.maxHp) state.profile.maxHp = 100;
  if (!state.profile.pet) {
    state.profile.pet = { type: 'slime', stage: 1, name: 'Buddy' };
  }

  if (!state.stories || !Array.isArray(state.stories)) {
    state.stories = [STORY_DATA];
  }

  // Ensure activeStory exists
  if (!state.activeStory) {
    state.activeStory = {
      id: STORY_DATA.id,
      currentStepId: 1,
      streakProgress: 0
    };
  }

  // Clean up old fields from previous state structure
  if (state.activeStory) {
    delete (state.activeStory as any).title;
    delete (state.activeStory as any).steps;
  }

  return state as QuestArcState;
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

export function updateXp(state: QuestArcState, amount: number): { state: QuestArcState; leveledUp: boolean } {
  state.profile.xp += amount;
  let leveledUp = false;

  while (state.profile.xp >= state.profile.xpToNextLevel) {
    state.profile.xp -= state.profile.xpToNextLevel;
    state.profile.level += 1;
    state.profile.xpToNextLevel = state.profile.level * 100;

    // Pet evolution check
    if (state.profile.level % 5 === 0) {
      if (state.profile.pet.stage < 3) {
        state.profile.pet.stage += 1;
      }
    }

    leveledUp = true;
  }

  return { state, leveledUp };
}
