import { MESSAGE_TYPES } from '../types/messages';
import { QuestArcState, HeroStory } from '../types/state';
import { createInitialState } from '../lib/state-manager';
import { PluginService } from '../services/PluginService';

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

            default:
                PluginService.log.warn('Unknown message type:', message.type);
                return { error: 'Unknown message type' };
        }
    }
}
