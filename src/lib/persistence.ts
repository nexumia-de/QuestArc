import { QuestArcState } from '../types/state';

const STORAGE_KEY = 'questarc_state';

const DEFAULT_STATE: QuestArcState = {
    version: 1,
    profile: {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        hp: 100,
        maxHp: 100,
        avatar: {
            skinColor: '#ffdbac',
            bgColor: '#ffffff',
            eyes: 'neutral',
            mouth: 'neutral'
        }
    },
    stories: [],
    completedStories: [],
    activeStory: {
        id: null,
        currentStepId: 0,
        taskProgress: {}
    },
    activeBoss: null
};

export const Persistence = {
    loadState(): QuestArcState {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return DEFAULT_STATE;
            const state = JSON.parse(raw);
            // Basic migration check could go here
            return { ...DEFAULT_STATE, ...state, profile: { ...DEFAULT_STATE.profile, ...state.profile } };
        } catch (e) {
            console.error('Failed to load QuestArc state', e);
            return DEFAULT_STATE;
        }
    },

    saveState(state: QuestArcState) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            // Dispatch a custom event so UI components can react immediately if they listen
            window.dispatchEvent(new CustomEvent('questarc-state-update', { detail: state }));
        } catch (e) {
            console.error('Failed to save QuestArc state', e);
        }
    }
};
