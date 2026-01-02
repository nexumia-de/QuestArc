import { QuestArcState, HeroStory } from '../../types/state';
import storyDataRaw from '../../assets/stories/productivity-mastery.json';
import {
    XP_PER_LEVEL_MULTIPLIER,
    INITIAL_LEVEL,
    INITIAL_XP,
    INITIAL_HP,
    INITIAL_MAX_HP,
    PET_INITIAL_STAGE
} from '../constants';

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
        taskProgress: {}
    },
    activeBoss: null,
};
