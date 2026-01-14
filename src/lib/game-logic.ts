import { Modifier, QuestArcState, StoryStep } from '../types/state';
import { BASE_BOSS_DAMAGE } from './constants';

interface TaskStub {
  tagIds: string[];
  title: string;
  notes?: string;
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
import { parseXpTag, compileTaskData } from './parsers';
import { Task } from '../types/plugin-api';

export function checkLevelUp(state: QuestArcState): { newState: QuestArcState; leveledUp: boolean } {
  let newState = { ...state };
  let leveledUp = false;

  while (newState.profile.xp >= newState.profile.xpToNextLevel) {
    newState.profile.xp -= newState.profile.xpToNextLevel;
    newState.profile.level += 1;
    newState.profile.xpToNextLevel = Math.floor(newState.profile.xpToNextLevel * 1.5);
    leveledUp = true;
  }
  return { newState, leveledUp };
}

/**
 * Processes a task completion and updates game state accordingly
 * @returns Object with game state updates AND task updates (if task should be modified/unchecked)
 */
export function processTaskCompletion(
  state: QuestArcState,
  _task: TaskStub,
  currentStep: StoryStep
): {
  newState: QuestArcState;
  damageDealt: number;
  xpGained: number;
  stepCompleted: boolean;
  leveledUp: boolean;
  taskUpdates?: Partial<Task>;
} {
  let damageDealt = 0;
  let xpGained = 0;
  let stepCompleted = false;
  let leveledUp = false;
  let taskUpdates: Partial<Task> | undefined;
  let newState = { ...state };

  if (state.activeStory.isCompleted) {
    return { newState, damageDealt: 0, xpGained: 0, stepCompleted: false, leveledUp: false };
  }

  // 0. Parse Task Metadata (QUEST_DATA persistence)
  // We try to look for JSON in notes first (Source of Truth for stateful tasks)
  let questData = null;
  if (_task.notes) {
    try {
      // Look for validation block or just parse assuming it might be wrapped
      // For now, let's assume if it starts with { it might be JSON, or searched for specific block
      // Roadmap says: ```json\n{...}\n``` or just raw text? 
      // Implementation Plan says: Injection of `QUEST_DATA` JSON into notes.
      // Let's regex for the block.
      const match = _task.notes.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        questData = JSON.parse(match[1]);
      }
    } catch (e) {
      // invalid json, ignore
    }
  }

  // Fallback to title parsing if no notes data or if it's the first time
  if (!questData) {
    const compiled = compileTaskData(_task.title);
    questData = compiled.data;
    // If we compiled it, it means we might need to initialize the note structure?
    // But we only do that if it's a Grind/Habit that needs tracking.
    // Simple tasks don't strictly need persistence if they just complete.
  }

  const type = questData.meta.type;

  // LOGIC: Handle Task Types
  if (type === 'GRIND') {
    // Grind: Increment current count
    const current = questData.progress?.current || 0;
    const target = questData.progress?.target || 1;

    if (current < target) {
      const newCurrent = current + 1;
      questData.progress.current = newCurrent;

      // Update Task: Keep it incomplete!
      taskUpdates = {
        isDone: false,
        title: _task.title, // Optionally update title to show progress? e.g. "50x Pushups (10/50)"
        notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
      };

      // Update Title Visual?
      // If title doesn't already have progress, maybe append it?
      // For now, let's just stick to the notes persistence as the mechanism.

      if (newCurrent < target) {
        // Not done yet, so we return here!
        // Grinds awarding XP per rep? Or only on completion? 
        // Usually Grinds award small XP per rep or big XP on completion.
        // Let's give small XP (1) per rep for feeling of progress?
        xpGained = 1;
        newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };

        return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
      }
      // If we reached target, we fall through to "Completion" logic below
      // But we still might want to update the note to say 50/50?
      // Actually if it completes, it gets hidden (isDone=true), so notes update might be irrelevant 
      // unless user un-completes it.
    }
  } else if (type === 'HABIT') {
    // Habit: Check if done for today
    // For MVP, completing a habit just increments its "streak" or "done count" and keeps it open
    // UNLESS we want to enforce "Daily limit".
    // Let's assume Habit = Always recurring, so we uncheck it.

    taskUpdates = {
      isDone: false,
      notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
    };

    // Award XP for the habit rep
    xpGained = questData.reward?.xp || 10;
    newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };

    // Check Level Up immediately for habits
    const lvl = checkLevelUp(newState);
    newState = lvl.newState;
    leveledUp = lvl.leveledUp;

    return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
  }

  // --- STANDARD COMPLETION (Simple Task or Finished Grind) ---

  const requirement = currentStep.completion;

  // 1. Calculate XP (if not already handled above)
  if (xpGained === 0) {
    const { xp } = parseXpTag(_task.title);
    xpGained = xp || 10;
    newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
  }

  // Check Level Up
  const levelResult = checkLevelUp(newState);
  newState = levelResult.newState;
  leveledUp = levelResult.leveledUp;


  // 2. Update Progress for this specific task
  const normalize = (s: string) => s.trim().toLowerCase();
  const matchingDef = currentStep.tasksToCreate?.find(t => normalize(t.title) === normalize(_task.title));

  if (matchingDef) {
    const currentCount = newState.activeStory.taskProgress[_task.title] || 0;
    newState.activeStory.taskProgress = {
      ...newState.activeStory.taskProgress,
      [_task.title]: currentCount + 1
    };
  }

  // 3. Check Step Completion & Boss Damage
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
    const tasks = currentStep.tasksToCreate || [];
    const requiredTasks = tasks.filter(t => t.isRequired !== false);

    const allMet = requiredTasks.every(def => {
      const progress = newState.activeStory.taskProgress[def.title] || 0;
      const target = def.requiredCount || 1;
      return progress >= target;
    });

    if (requiredTasks.length > 0 && allMet) {
      stepCompleted = true;
    } else if (requiredTasks.length === 0) {
      stepCompleted = true;
    }
  }

  return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
}
