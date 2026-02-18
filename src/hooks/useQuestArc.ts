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

    const deleteStory = async (storyId: string, onSuccess?: () => void) => {
        try {
            const response = await MessageService.send<{ success: boolean; error?: string }>(
                MESSAGE_TYPES.DELETE_STORY,
                { storyId }
            );

            if (response && response.success) {
                await refreshState();
                if (onSuccess) onSuccess();
            } else {
                logger.error('Failed to delete story:', response?.error);
                setActionError(response?.error || 'Failed to delete story');
            }
        } catch (error) {
            logger.error('Delete story error:', error);
            setActionError('Failed to delete story');
        }
    };

    const cancelQuest = async (onSuccess?: () => void) => {
        try {
            const response = await MessageService.send<{ success: boolean; error?: string }>(
                MESSAGE_TYPES.CANCEL_QUEST
            );

            if (response && response.success) {
                await refreshState();
                if (onSuccess) onSuccess();
            } else {
                logger.error('Failed to cancel quest:', response?.error);
                setActionError(response?.error || 'Failed to cancel quest');
            }
        } catch (error) {
            logger.error('Cancel quest error:', error);
            setActionError('Failed to cancel quest');
        }
    };

    const pauseQuest = async (onSuccess?: () => void) => {
        try {
            const response = await MessageService.send<{ success: boolean; error?: string }>(
                MESSAGE_TYPES.PAUSE_QUEST
            );
            if (response && response.success) {
                await refreshState();
                if (onSuccess) onSuccess();
            } else {
                logger.error('Failed to pause quest:', response?.error);
                setActionError(response?.error || 'Failed to pause quest');
            }
        } catch (error) {
            logger.error('Pause quest error:', error);
            setActionError('Failed to pause quest');
        }
    };

    const resumeQuest = async (projectId: string, onSuccess?: () => void) => {
        try {
            const response = await MessageService.send<{ success: boolean; error?: string }>(
                MESSAGE_TYPES.RESUME_QUEST,
                { projectId }
            );
            if (response && response.success) {
                await refreshState();
                if (onSuccess) onSuccess();
            } else {
                logger.error('Failed to resume quest:', response?.error);
                setActionError(response?.error || 'Failed to resume quest');
            }
        } catch (error) {
            logger.error('Resume quest error:', error);
            setActionError('Failed to resume quest');
        }
    };

    const updateSettings = async (settings: QuestArcState['settings'], onSuccess?: () => void) => {
        try {
            const response = await MessageService.send<{ success: boolean; error?: string }>(
                MESSAGE_TYPES.UPDATE_SETTINGS,
                { settings }
            );
            if (response && response.success) {
                await refreshState();
                if (onSuccess) onSuccess();
            } else {
                logger.error('Failed to update settings:', response?.error);
                setActionError(response?.error || 'Failed to update settings');
            }
        } catch (error) {
            logger.error('Update settings error:', error);
            setActionError('Failed to update settings');
        }
    };

    const skipStep = async (onSuccess?: () => void) => {
        try {
            const response = await MessageService.send<QuestArcState>(
                MESSAGE_TYPES.SKIP_STEP
            );
            if (response) {
                setState(response);
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            logger.error('Skip step error:', error);
            setActionError('Failed to skip step');
        }
    };

    return {
        state,
        actionError,
        saveStory,
        startQuest,
        handleAcknowledgeCompletion,
        addStepTasks,
        resetGame,
        setActionError,
        deleteStory,
        cancelQuest,
        pauseQuest,
        resumeQuest,
        updateSettings,
        skipStep
    };
};
