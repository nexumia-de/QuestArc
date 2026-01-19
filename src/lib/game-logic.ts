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
  currentStep?: StoryStep
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
      // Regex to find JSON block, handling various newline formats and potential missing newlines
      const match = _task.notes.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        questData = JSON.parse(match[1]);
      } else {
        // Fallback: Try to find a raw JSON object if no code blocks are present
        // This handles cases where user might have pasted just the JSON
        const rawJsonMatch = _task.notes.match(/\{[\s\S]*"meta"[\s\S]*\}/);
        if (rawJsonMatch) {
          questData = JSON.parse(rawJsonMatch[0]);
        }
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

      // Update Task status
      const isFinished = newCurrent >= target;

      taskUpdates = {
        isDone: !isFinished ? false : true, // If finished, let it be checked (true). If not, uncheck it (false).
        title: _task.title,
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
    // Habit Logic:
    // 1. If it has a target (multi-count), increment it.
    // 2. If current < target, keep it unchecked (isDone = false).
    // 3. If current >= target, let it complete (isDone = true) -> User finished for the day.

    // Check if progress tracking exists
    const current = questData.progress?.current || 0;
    const target = questData.progress?.target || 1;

    // Increment (unless we are just completing a single-tick habit which has target=1, current=0)
    // Actually, persistence always starts at 0.
    const newCurrent = current + 1;
    const now = Date.now();

    if (questData.progress) {
      questData.progress.current = newCurrent;
      questData.progress.lastUpdated = now;
    }

    // Determine visual state
    const isFinishedForDay = newCurrent >= target;

    // Handle Streaks
    if (isFinishedForDay) {
      // Logic: If lastUpdated was NOT today (already checked by newCurrent logic incrementing),
      // And we just met the target.

      // Check if we already incremented streak today? 
      // questData.progress.lastUpdated is now `now`. 
      // But we need to know if we *just* finished it.
      // Actually, if newCurrent === target, we just finished it.
      // If newCurrent > target, we are over-completing (shouldn't double count streak).

      if (newCurrent === target && questData.progress?.streak) {
        // Increment Streak
        questData.progress.streak.current = (questData.progress.streak.current || 0) + 1;

        // Check Highest
        const currentStreak = questData.progress.streak.current;
        const highest = questData.progress.streak.highest || 0;
        if (currentStreak > highest) {
          questData.progress.streak.highest = currentStreak;
        }
      }
    }

    // Update Title with Progress if target > 1
    // e.g. "Drink Water" -> "Drink Water (1/3)"
    let newTitle = _task.title;

    // 1. Strip existing patterns
    // Strip (x/y)
    let baseTitle = _task.title.replace(/\s*\(\d+\/\d+\)$/, '');
    // Strip existing 🔥 streaks
    baseTitle = baseTitle.replace(/\s*🔥\s*\d+(\/\d+)?$/, '');

    // 2. Rebuild Title
    newTitle = baseTitle;

    // Add (x/y)
    if (target > 1) {
      newTitle = `${newTitle} (${newCurrent}/${target})`;
    }

    // Add Streak 🔥
    if (questData?.progress?.streak && questData.progress.streak.current > 0) {
      const sCurrent = questData.progress.streak.current;
      const sTarget = questData.progress.streak.target;

      let streakStr = `🔥 ${sCurrent}`;
      if (sTarget) {
        streakStr += `/${sTarget}`;
      }
      newTitle = `${newTitle} ${streakStr}`;
    }


    taskUpdates = {
      isDone: isFinishedForDay, // If finished, let it be checked. If not, uncheck it.
      title: newTitle,
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

  if (!currentStep) {
    // If we don't have a step, we can't do step completion logic.
    // But we still apply XP updates if calculated above (Grind/Habit XP).
    return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
  }

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
