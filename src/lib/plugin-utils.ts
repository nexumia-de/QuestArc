import { QuestArcState, HeroStory, StoryStep } from "../types/state";

// ----------------------------------------------------------------------
// Constants (Inlined to prevent shared chunk)
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Logger (Inlined to prevent shared chunk)
// ----------------------------------------------------------------------

const LOG_PREFIX = "QuestArc[Plugin]:";

export const logger = {
  debug(message: string, ...args: any[]): void {
    console.debug(`${LOG_PREFIX} ${message}`, ...args);
  },

  info(message: string, ...args: any[]): void {
    console.log(`${LOG_PREFIX} ${message}`, ...args);
  },

  warn(message: string, ...args: any[]): void {
    console.warn(`${LOG_PREFIX} ${message}`, ...args);
  },

  error(message: string, ...args: any[]): void {
    console.error(`${LOG_PREFIX} ${message}`, ...args);
  },
};

// ----------------------------------------------------------------------
// State Helpers (Inlined to prevent shared chunk)
// ----------------------------------------------------------------------

export function getActiveStory(state: QuestArcState): HeroStory | undefined {
  if (!state.activeStory.id) return undefined;

  const story = state.stories.find((s) => s.id === state.activeStory.id);

  if (!story) {
    logger.warn(`Active story not found: ${state.activeStory.id}`);
  }

  return story;
}

export function getCurrentStep(state: QuestArcState): StoryStep | undefined {
  const activeStory = getActiveStory(state);

  if (!activeStory) {
    return undefined;
  }

  if (!activeStory.steps || activeStory.steps.length === 0) {
    logger.warn(`Active story ${activeStory.id} has no steps`);
    return undefined;
  }

  const step = activeStory.steps.find(
    (s) => s.id === state.activeStory.currentStepId,
  );

  if (!step) {
    logger.warn(
      `Step ${state.activeStory.currentStepId} not found in story ${activeStory.id}. ` +
        `Falling back to first step.`,
    );
    return activeStory.steps[0];
  }

  return step;
}
