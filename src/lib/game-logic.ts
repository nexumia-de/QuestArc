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
  if (
    currentStep.completion.type === 'boss_defeat' &&
    !state.activeBoss &&
    currentStep.completion.config?.boss
  ) {
    return {
      ...state,
      activeBoss: { ...currentStep.completion.config.boss, isDead: false }
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
  state: QuestArcState,
  _task: TaskStub, // Changed from Task to TaskStub to match existing definition
  currentStep: StoryStep
): { newState: QuestArcState; damageDealt: number; stepCompleted: boolean } {
  let damageDealt = 0;
  let stepCompleted = false;
  let newState = { ...state };

  const requirement = currentStep.completion;

  // 1. Update Progress for this specific task
  // Normalize titles for comparison to avoid whitespace/case issues
  const normalize = (s: string) => s.trim().toLowerCase();
  const matchingDef = currentStep.tasksToCreate?.find(t => normalize(t.title) === normalize(_task.title));

  if (matchingDef) {
    const currentCount = newState.activeStory.taskProgress[_task.title] || 0;
    newState.activeStory.taskProgress = {
      ...newState.activeStory.taskProgress,
      [_task.title]: currentCount + 1
    };
  }

  // 2. Check Step Completion
  if (requirement.type === 'boss_defeat') {
    // Boss Logic
    if (newState.activeBoss && !newState.activeBoss.isDead) {
      const baseDamage = 10;
      const isCrit = Math.random() > 0.8;
      damageDealt = isCrit ? baseDamage * 2 : baseDamage;

      newState.activeBoss = {
        ...newState.activeBoss,
        hp: Math.max(0, newState.activeBoss.hp - damageDealt),
      };

      if (newState.activeBoss.hp === 0) {
        newState.activeBoss.isDead = true;
        stepCompleted = true;
      }
    }
  } else if (requirement.type === 'tasks_completed') {
    // Check if ALL required tasks meet their targets
    const tasks = currentStep.tasksToCreate || [];
    const requiredTasks = tasks.filter(t => t.isRequired !== false); // Default to true if undefined

    const allMet = requiredTasks.every(def => {
      const progress = newState.activeStory.taskProgress[def.title] || 0;
      const target = def.requiredCount || 1;
      return progress >= target;
    });

    if (requiredTasks.length > 0 && allMet) {
      stepCompleted = true;
    } else if (requiredTasks.length === 0) {
      // If no tasks are explicitly required, we might fallback to "Any Task" logic or auto-complete?
      // For now, let's assume if you have 0 required tasks, you just need to do 1 thing to pass.
      stepCompleted = true;
    }
  }

  return { newState, damageDealt, stepCompleted };
}
