import { MESSAGE_TYPES } from '../types/messages';
import { QuestArcState, HeroStory } from '../types/state';
import { createInitialState, getCurrentStep } from '../lib/state-manager';
import { initializeBossIfNeeded } from '../lib/game-logic';
import { PluginService } from '../services/PluginService';
import { TaskService } from '../services/TaskService';

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

            case MESSAGE_TYPES.DEV_RESET:
                PluginService.log.info('Resetting progress');
                const cleanState = createInitialState();
                updateState(cleanState);
                await saveCallback();
                PluginService.log.info('Progress reset');
                return cleanState;

            case MESSAGE_TYPES.SAVE_STORY:
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

            case MESSAGE_TYPES.START_QUEST:
                const { storyId } = message.payload;
                PluginService.log.info('Starting quest:', storyId);

                const story = state.stories.find(s => s.id === storyId);
                if (!story) {
                    PluginService.log.error('Story not found:', storyId);
                    return { error: 'Story not found' };
                }

                // Activate Story
                // Reset active story progress if switching (or maybe we keep progress?)
                // For now, let's just switch the ID. If we want to restart, we might need more logic.
                // The current requirement says "Start the quest", implying selection.

                // If switching to a NEW story, we might want to ensure we're on step 1 or valid step
                // But let's assume simple switch for now.

                // Create base new state with switched story
                let newState: QuestArcState = {
                    ...state,
                    activeStory: {
                        ...state.activeStory,
                        id: storyId,
                        currentStepId: story.steps[0]?.id || 1,
                        taskProgress: {}
                    },
                    activeBoss: null // Reset boss when starting new story
                };

                // Initialize boss if the new step requires it
                const startStep = story.steps.find(s => s.id === (story.steps[0]?.id || 1));
                if (startStep) {
                    newState = initializeBossIfNeeded(newState, startStep);

                    try {
                        // Auto-create tasks for the first step if configured
                        await TaskService.createTasksForStep(startStep);
                        newState.activeStory.tasksCreatedForStepId = startStep.id;
                    } catch (err) {
                        PluginService.log.error('Failed to auto-create tasks for start step', err);
                    }
                }

                updateState(newState);
                await saveCallback();
                return { success: true };

            case MESSAGE_TYPES.ADD_STEP_TASKS:
                PluginService.log.info('Adding tasks for current step');
                const currentStep = getCurrentStep(state);

                if (currentStep) {
                    await TaskService.createTasksForStep(currentStep);
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
                    return { error: 'No active step found' };
                }

            default:
                PluginService.log.warn('Unknown message type:', message.type);
                return { error: 'Unknown message type' };
        }
    }
}
