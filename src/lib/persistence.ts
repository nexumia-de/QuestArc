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
    stories: [
        {
            id: 'story_productivity_mastery',
            title: 'Productivity Mastery',
            steps: [
                {
                    id: 1,
                    title: 'Chapter 1: The Awakening',
                    flavor_text: "Chaos. Organize.",
                    summary_text: "Chaos defeated.",
                    story_icon: "🌅",
                    xpReward: 50,
                    nextStepId: 2,
                    display_mode: 'visible',
                    completion: {
                        type: 'tasks_completed'
                    },
                    tasksToCreate: [
                        { title: 'Set 3 Goals for the Week', isAutoCreate: true },
                        { title: 'Create "Work" and "Personal" Tags', isAutoCreate: true },
                        { title: 'Cleansing Ritual: Clear Inbox', isAutoCreate: true }
                    ]
                },
                {
                    id: 2,
                    title: 'Boss Battle: Procrastination Demon',
                    flavor_text: "Shadow figure. Strike!",
                    story_icon: "⚔️",
                    xpReward: 200,
                    nextStepId: 3,
                    display_mode: 'visible',
                    completion: {
                        type: 'boss_defeat',
                        config: {
                            boss: {
                                name: 'Procrastination Demon',
                                hp: 50,
                                maxHp: 50,
                                image: '👹',
                                themeColor: '#8b0000',
                                damageModifiers: [
                                    { trigger: { type: 'tag', value: 'focus' }, multiplier: 2.0 }
                                ]
                            }
                        }
                    },
                    tasksToCreate: []
                },
                {
                    id: 3,
                    title: 'Chapter 2: The Grind',
                    flavor_text: "Entropy remains.",
                    story_icon: "💪",
                    xpReward: 100,
                    nextStepId: 4,
                    display_mode: 'visible',
                    completion: {
                        type: 'tasks_completed'
                    },
                    tasksToCreate: [
                        {
                            title: '50x Pushups',
                            isAutoCreate: true,
                            notes: '```json\n{"meta":{"type":"GRIND"},"progress":{"current":0,"target":50}}\n```'
                        },
                        {
                            title: '3x @daily Drink Water',
                            isAutoCreate: true,
                            notes: '```json\n{"meta":{"type":"HABIT","target":3,"frequency":"@daily"}}\n```'
                        }
                    ]
                },
                {
                    id: 4,
                    title: 'Boss Battle: The Shadow Self',
                    flavor_text: "The final challenge.",
                    story_icon: "👹",
                    xpReward: 500,
                    nextStepId: null,
                    display_mode: 'visible',
                    completion: {
                        type: 'boss_defeat',
                        config: {
                            boss: {
                                name: 'The Shadow Self',
                                hp: 200,
                                maxHp: 200,
                                themeColor: '#4a4a4a',
                                damageModifiers: []
                            }
                        }
                    },
                    tasksToCreate: []
                }
            ]
        }
    ],
    completedStories: [],
    activeStory: {
        id: 'story_productivity_mastery',      // Start active for seamless onboarding
        currentStepId: 1,
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
