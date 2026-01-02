import { QuestArcState, HeroStory } from '../types/state';
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
  },
  activeStory: {
    id: STORY_DATA.id,
    title: STORY_DATA.title,
    currentStepId: 1,
    streakProgress: 0,
    steps: STORY_DATA.steps,
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

  if (state.activeStory && !state.activeStory.steps) {
    state.activeStory.title = STORY_DATA.title;
    state.activeStory.steps = STORY_DATA.steps;
  }

  return state as QuestArcState;
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
    leveledUp = true;
  }

  return { state, leveledUp };
}
