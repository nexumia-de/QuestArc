import { QuestArcState, HeroStory } from '../../types/state';
import storyDataRaw from '../../assets/stories/productivity-mastery.json';
import {
    XP_PER_LEVEL_MULTIPLIER,
    INITIAL_LEVEL,
    INITIAL_XP,



    PET_INITIAL_STAGE
} from '../constants';

const STORY_DATA = storyDataRaw as HeroStory;

export const STARTING_HP = 100;
export const STARTING_MAX_HP = 100;

export const CURRENT_STATE_VERSION = 1;

export const INITIAL_STATE: QuestArcState = {
    version: CURRENT_STATE_VERSION,
    profile: {
        level: INITIAL_LEVEL,
        xp: INITIAL_XP,
        xpToNextLevel: INITIAL_LEVEL * XP_PER_LEVEL_MULTIPLIER,
        hp: STARTING_HP,
        maxHp: STARTING_MAX_HP,

        pet: {
            type: 'slime',
            stage: PET_INITIAL_STAGE,
            name: 'Buddy',
        },
        avatar: {
            skinColor: '#ffe4c4',
            bgColor: '#e0e7ff',
            eyes: 'neutral',
            mouth: 'neutral'
        }
    },
    stories: [STORY_DATA],
    completedStories: [],
    activeStory: {
        id: null,
        currentStepId: 1,
        taskProgress: {}
    },
    activeBoss: null,
};
