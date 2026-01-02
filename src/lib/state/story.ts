import { QuestArcState, HeroStory, StoryStep } from '../../types/state';
import { logger } from '../logger';

/**
 * Retrieves the currently active story from the state
 * @param state - The game state
 * @returns The active story object, or undefined if not found
 * @remarks Logs a warning if the active story ID doesn't exist in the stories array
 */
export function getActiveStory(state: QuestArcState): HeroStory | undefined {
    const story = state.stories.find(s => s.id === state.activeStory.id);

    if (!story) {
        logger.warn(`Active story not found: ${state.activeStory.id}`);
    }

    return story;
}

/**
 * Gets the current step of the active story with validation and fallback
 * @param state - The game state
 * @returns The current step, or undefined if story/steps don't exist
 * @remarks Falls back to the first step if the current step ID is invalid. Logs warnings for validation failures.
 */
export function getCurrentStep(state: QuestArcState): StoryStep | undefined {
    const activeStory = getActiveStory(state);

    if (!activeStory) {
        logger.warn('No active story found');
        return undefined;
    }

    if (!activeStory.steps || activeStory.steps.length === 0) {
        logger.warn(`Active story ${activeStory.id} has no steps`);
        return undefined;
    }

    const step = activeStory.steps.find(s => s.id === state.activeStory.currentStepId);

    if (!step) {
        logger.warn(
            `Step ${state.activeStory.currentStepId} not found in story ${activeStory.id}. ` +
            `Falling back to first step.`
        );
        // Fallback to first step to prevent complete failure
        return activeStory.steps[0];
    }

    return step;
}

/**
 * Gets the title of the current step with a fallback
 * @param state - The game state
 * @returns The current step title, or a formatted version of the story ID if step not found
 */
export function getCurrentStepTitle(state: QuestArcState): string {
    const currentStep = getCurrentStep(state);
    if (currentStep?.title) {
        return currentStep.title;
    }
    return state.activeStory.id.replace(/_/g, ' ').toUpperCase();
}
