import { Modifier, QuestArcState, StoryStep } from '../types/state';
import { BASE_BOSS_DAMAGE } from './constants';

interface TaskStub {
  tagIds: string[];
  title: string;
}

/**
 * Calculates damage dealt to a boss based on task tags and modifiers
 * @param task - The completed task
 * @param modifiers - Array of damage modifiers from the boss configuration
 * @returns The calculated damage amount
 * @remarks Base damage is multiplied by all matching tag modifiers
 */
export function calculateDamage(task: TaskStub, modifiers: Modifier[] = []): number {
  let multiplier = 1.0;

  for (const mod of modifiers) {
    if (mod.trigger.type === 'tag' && task.tagIds.includes(mod.trigger.value)) {
      multiplier *= mod.multiplier;
    }
  }

  return BASE_BOSS_DAMAGE * multiplier;
}

/**
 * Initializes a boss battle if the current step is a boss step and no boss is active
 * @param state - The current game state
 * @param currentStep - The current story step
 * @returns Updated state with boss initialized, or unchanged state if not needed
 * @remarks Only initializes if the step type is 'boss', boss config exists, and no active boss
 */
export function initializeBossIfNeeded(
  state: QuestArcState,
  currentStep: StoryStep
): QuestArcState {
  if (currentStep.type === 'boss' && !state.activeBoss && currentStep.boss) {
    return {
      ...state,
      activeBoss: { ...currentStep.boss, isDead: false }
    };
  }
  return state;
}

/**
 * Processes a task completion and updates game state accordingly
 * @param currentState - The current game state
 * @param task - The completed task
 * @param currentStep - The current story step
 * @returns An object containing the updated state, damage dealt, and whether the step was completed
 * @remarks Handles three step types: boss (damage calculation), streak (progress counter), and simple (immediate completion).
 * Creates a deep copy of state to avoid mutations.
 */
export function processTaskCompletion(
  currentState: QuestArcState,
  task: TaskStub,
  currentStep: StoryStep
): { newState: QuestArcState; damageDealt: number; stepCompleted: boolean } {
  let damageDealt = 0;
  let stepCompleted = false;

  // Create a deep copy of the state to avoid any mutations affecting the original
  const newState = JSON.parse(JSON.stringify(currentState)) as QuestArcState;

  // Handle Boss logic
  if (currentStep.type === 'boss' && newState.activeBoss) {
    damageDealt = calculateDamage(task, currentStep.boss?.damageModifiers);
    newState.activeBoss.hp -= damageDealt;

    if (newState.activeBoss.hp <= 0) {
      newState.activeBoss.hp = 0;
      newState.activeBoss.isDead = true;
      stepCompleted = true;
    }
  }
  // Handle Streak logic
  else if (currentStep.condition?.type === 'streak') {
    newState.activeStory.streakProgress += 1;
    if (newState.activeStory.streakProgress >= currentStep.condition.target) {
      stepCompleted = true;
    }
  }
  // Handle Simple logic (count or just completion)
  else {
    stepCompleted = true;
  }

  return { newState, damageDealt, stepCompleted };
}
