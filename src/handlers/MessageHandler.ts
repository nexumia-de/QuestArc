import { getCurrentStep } from '../lib/plugin-utils';
import { MESSAGE_TYPES } from '../types/messages';
import { QuestArcState, HeroStory } from '../types/state';
import { createInitialState } from '../lib/state/persistence'; // Correct path
import { PluginService } from '../services/PluginService';
import { TaskService } from '../services/TaskService';
import { QuestManagerService } from '../services/manager.service';
import { CronHelper } from '../lib/cron';

export class MessageHandler {
    static async handle(
        message: any,
        state: QuestArcState,
        updateState: (newState: QuestArcState) => void,
        saveCallback: () => Promise<void>
    ): Promise<any> {
        PluginService.log.debug('Received message from UI:', message);

        switch (message.type) {
            case MESSAGE_TYPES.REQUEST_SYNC:
                PluginService.log.debug('Sending state to UI');
                return state;

            case MESSAGE_TYPES.DEV_RESET: {
                PluginService.log.info('Resetting progress');
                const cleanState = createInitialState();
                updateState(cleanState);
                await saveCallback();
                PluginService.log.info('Progress reset');
                return cleanState;
            }

            case MESSAGE_TYPES.SAVE_STORY: {
                const newStory = message.payload as HeroStory;
                PluginService.log.info('Saving story:', newStory.title);

                // Validation
                if (!newStory.id || !newStory.steps || newStory.steps.length === 0) {
                    PluginService.log.error('Invalid story format', newStory);
                    return { error: 'Invalid Story Format' };
                }

                const currentStories = state.stories ? [...state.stories] : [];
                const existingIdx = currentStories.findIndex(s => s.id === newStory.id);

                if (existingIdx > -1) {
                    currentStories[existingIdx] = newStory;
                } else {
                    currentStories.push(newStory);
                }

                updateState({ ...state, stories: currentStories });
                await saveCallback();

                PluginService.log.info(`Story saved: ${newStory.title}`);
                return { success: true, stories: currentStories };
            }

            case MESSAGE_TYPES.START_QUEST: {
                const { storyId } = message.payload;
                PluginService.log.info('Starting quest (V2):', storyId);

                try {
                    const newState = await QuestManagerService.startQuest(storyId, state);
                    updateState(newState);
                    await saveCallback();
                    return { success: true };
                } catch (e: any) {
                    PluginService.log.error('Failed to start quest:', e);
                    return { error: e.message };
                }
            }

            case MESSAGE_TYPES.PAUSE_QUEST: {
                PluginService.log.info('Pausing quest');
                try {
                    const newState = await QuestManagerService.pauseQuest(state);
                    updateState(newState);
                    await saveCallback();
                    return { success: true };
                } catch (e: any) {
                    PluginService.log.error('Failed to pause quest:', e);
                    return { error: e.message };
                }
            }

            case MESSAGE_TYPES.RESUME_QUEST: {
                const { projectId } = message.payload;
                PluginService.log.info('Resuming quest:', projectId);
                try {
                    const newState = await QuestManagerService.resumeQuest(projectId, state);
                    updateState(newState);
                    await saveCallback();
                    return { success: true };
                } catch (e: any) {
                    PluginService.log.error('Failed to resume quest:', e);
                    return { error: e.message };
                }
            }

            case MESSAGE_TYPES.ADD_STEP_TASKS: {
                PluginService.log.info('Adding tasks for current step');
                // Note: This matches V1 logic. For V2 sequential loading, see CompilerService.compileNextTask
                // If we want to support manual add via UI for V2, we need to adapt QuestManagerService

                // Legacy support or fallback:
                const currentStep = getCurrentStep(state);
                if (currentStep) {
                    await TaskService.createTasksForStep(currentStep, true, state.activeStory.id);
                    updateState({
                        ...state,
                        activeStory: {
                            ...state.activeStory,
                            tasksCreatedForStepId: currentStep.id
                        }
                    });
                    await saveCallback();
                    return { success: true };
                } else {
                    // Try V2 injection?
                    if (state.activeStory.id) {
                        // Doing nothing for now as V2 uses CompilerService
                        return { success: true };
                    }
                    return { error: 'No active step found' };
                }
            }

            case MESSAGE_TYPES.ACKNOWLEDGE_COMPLETION: {
                PluginService.log.info('Acknowledging quest completion');

                // Archive the story
                const completedStoryId = state.activeStory.id;
                const completedStory = state.stories.find(s => s.id === completedStoryId);

                let newCompletedStories = state.completedStories || [];
                if (completedStory) {
                    newCompletedStories = [
                        ...newCompletedStories,
                        { ...completedStory, completedAt: Date.now() }
                    ];
                }

                // Keep the story in active stories (so it can be restarted)
                const remainingStories = state.stories; // Don't filter out

                updateState({
                    ...state,
                    stories: remainingStories,
                    completedStories: newCompletedStories,
                    activeStory: {
                        ...state.activeStory,
                        id: null,
                        isCompleted: false
                    }
                });
                await saveCallback();
                return { success: true };
            }

            case MESSAGE_TYPES.UPDATE_PROFILE: {
                const { profile } = message.payload;
                PluginService.log.info('Updating profile:', profile);

                updateState({
                    ...state,
                    profile: {
                        ...state.profile,
                        ...profile
                    }
                });
                await saveCallback();
                return { success: true };
            }

            case MESSAGE_TYPES.DELETE_STORY: {
                const { storyId } = message.payload;
                PluginService.log.info('Deleting story:', storyId);

                const currentStories = state.stories ? state.stories.filter(s => s.id !== storyId) : [];
                const currentCompleted = state.completedStories ? state.completedStories.filter(s => s.id !== storyId) : [];

                let activeStory = state.activeStory;
                if (activeStory.id === storyId) {
                    activeStory = {
                        ...activeStory,
                        id: null,
                        isCompleted: false,
                        tasksCreatedForStepId: null,
                        taskProgress: {}
                    };
                }

                updateState({
                    ...state,
                    stories: currentStories,
                    completedStories: currentCompleted,
                    activeStory
                });
                await saveCallback();
                return { success: true };
            }

            case MESSAGE_TYPES.CANCEL_QUEST: {
                PluginService.log.info('Cancelling active quest');

                updateState({
                    ...state,
                    activeStory: {
                        ...state.activeStory,
                        id: null,
                        currentStepId: 1,
                        isCompleted: false,
                        tasksCreatedForStepId: null,
                        taskProgress: {}
                    },
                    activeBoss: null
                });
                await saveCallback();
                return { success: true };
            }

            case MESSAGE_TYPES.UPDATE_SETTINGS: {
                const { settings } = message.payload;
                PluginService.log.info('Updating settings');

                // Validate System Tags (Prevent deletion/renaming)
                const currentSystemTags = state.settings.customTags.filter(t => t.isSystem);
                const newSystemTags = settings.customTags.filter((t: any) => t.isSystem);

                // Ensure all system tags are present and have correct names/IDs
                for (const sysTag of currentSystemTags) {
                    const match = newSystemTags.find((t: any) => t.id === sysTag.id);
                    if (!match) {
                        return { error: `Cannot delete system tag ${sysTag.tag}` };
                    }
                    if (match.tag !== sysTag.tag) {
                        return { error: `Cannot rename system tag ${sysTag.tag}` };
                    }
                }

                updateState({
                    ...state,
                    settings
                });

                // Sync custom frequency aliases to CronHelper
                if (settings.customFrequencyAliases) {
                    CronHelper.setCustomAliases(settings.customFrequencyAliases);
                }

                await saveCallback();
                return { success: true };
            }

            default:
                PluginService.log.warn('Unknown message type:', message.type);
                return { error: 'Unknown message type' };
        }
    }
}
