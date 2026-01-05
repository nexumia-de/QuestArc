import { createSignal } from 'solid-js';
import { useStateSync } from './useStateSync';
import { MessageService } from '../services/MessageService';
import { MESSAGE_TYPES } from '../types/messages';
import { QuestArcState, HeroStory, StoryStep } from '../types/state';
import { logger } from '../lib/logger';

export const useQuestArc = () => {
    const { state, setState } = useStateSync();
    const [actionError, setActionError] = createSignal<string | null>(null);

    const refreshState = async () => {
        try {
            const newState = await MessageService.send<QuestArcState>(MESSAGE_TYPES.REQUEST_SYNC);
            setState(newState);
        } catch (error) {
            logger.error('Failed to sync state:', error);
        }
    };

    const saveStory = async (
        storyId: string | undefined,
        title: string,
        steps: Omit<StoryStep, 'id' | 'nextStepId'>[],
        onSuccess?: () => void
    ) => {
        setActionError(null);

        try {
            const finalSteps = steps.map((step, index) => ({
                ...step,
                id: index + 1,
                nextStepId: index < steps.length - 1 ? index + 2 : null
            }));

            const storyToSave: HeroStory = {
                id: storyId || `story_${Date.now()}`,
                title: title,
                steps: finalSteps
            };

            const response = await MessageService.send<{ success: boolean; error?: string }>(
                MESSAGE_TYPES.SAVE_STORY,
                storyToSave
            );

            if (response && response.success) {
                await refreshState();
                if (onSuccess) onSuccess();
            } else {
                const errorMsg = response?.error || 'Failed to save story';
                setActionError(errorMsg);
                logger.error('Save story failed:', errorMsg);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Network error occurred';
            setActionError(`Failed to save: ${errorMsg}`);
            logger.error('Save story error:', error);
        }
    };

    const startQuest = async (storyId: string, onSuccess?: () => void) => {
        try {
            const response = await MessageService.send<{ success: boolean; error?: string }>(
                MESSAGE_TYPES.START_QUEST,
                { storyId }
            );

            if (response && response.success) {
                await refreshState();
                if (onSuccess) onSuccess();
            } else {
                logger.error('Failed to start quest:', response?.error);
            }
        } catch (error) {
            logger.error('Start quest error:', error);
        }
    };

    const handleAcknowledgeCompletion = async () => {
        const response = await MessageService.send<{ success: boolean }>(MESSAGE_TYPES.ACKNOWLEDGE_COMPLETION);
        if (response && response.success) {
            // Optimistic update
            const currentState = state();
            if (currentState) {
                setState({
                    ...currentState,
                    activeStory: {
                        ...currentState.activeStory,
                        id: null,
                        isCompleted: false
                    }
                });
            }
        }
    };

    const addStepTasks = async () => {
        await MessageService.send(MESSAGE_TYPES.ADD_STEP_TASKS);
    };

    const resetGame = async (onSuccess?: () => void) => {
        const newState = await MessageService.send<QuestArcState>(MESSAGE_TYPES.DEV_RESET);
        setState(newState);
        if (onSuccess) onSuccess();
    };

    return {
        state,
        actionError,
        saveStory,
        startQuest,
        handleAcknowledgeCompletion,
        addStepTasks,
        resetGame,
        setActionError
    };
};
