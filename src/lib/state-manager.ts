import { QuestArcState } from '../types/state';

export const INITIAL_STATE: QuestArcState = {
  profile: {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
  },
  activeStory: {
    id: 'story_productivity_mastery',
    currentStepId: 1,
    streakProgress: 0,
  },
  activeBoss: null,
};

export function createInitialState(): QuestArcState {
  return JSON.parse(JSON.stringify(INITIAL_STATE));
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
