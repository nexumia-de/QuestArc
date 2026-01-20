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
  let stepProgressIncrement = 0; // NEW: Track if we should increment parent step progress

  if (state.activeStory.isCompleted) {
    return { newState, damageDealt: 0, xpGained: 0, stepCompleted: false, leveledUp: false };
  }

  // 0. Parse Task Metadata (QUEST_DATA persistence)
  let questData = null;
  if (_task.notes) {
    try {
      const match = _task.notes.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        questData = JSON.parse(match[1]);
      } else {
        const rawJsonMatch = _task.notes.match(/\{[\s\S]*"meta"[\s\S]*\}/);
        if (rawJsonMatch) {
          questData = JSON.parse(rawJsonMatch[0]);
        }
      }
    } catch (e) {
      // invalid json, ignore
    }
  }

  if (!questData) {
    const compiled = compileTaskData(_task.title);
    questData = compiled.data;
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

      const isFinished = newCurrent >= target;

      // Mod: Update Title Visual
      let newTitle = _task.title;
      newTitle = newTitle.replace(/\s*\(\d+\/\d+\)$/, '');
      const progressStr = `(${newCurrent}/${target})`;
      newTitle = `${newTitle} ${progressStr}`;

      taskUpdates = {
        isDone: !isFinished ? false : true,
        title: newTitle,
        notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
      };

      if (newCurrent < target) {
        xpGained = 1;
        newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
        return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
      }
      // Finished! Fall through to standard completion (stepProgressIncrement = 1 via default fallthrough logic?)
      // Actually, if we fall through, we need to ensure we mark it as a completion.
      // We'll let the standard block handle the increment.
    }
  } else if (type === 'HABIT') {
    // Habit Logic
    const current = questData.progress?.current || 0;
    const target = questData.progress?.target || 1;

    const newCurrent = current + 1;
    const now = Date.now();

    if (questData.progress) {
      questData.progress.current = newCurrent;
      questData.progress.lastUpdated = now;
    }

    const isFinishedForDay = newCurrent >= target;

    // Handle Streaks
    if (isFinishedForDay) {
      if (newCurrent === target && questData.progress?.streak) {
        questData.progress.streak.current = (questData.progress.streak.current || 0) + 1;
        const currentStreak = questData.progress.streak.current;
        const highest = questData.progress.streak.highest || 0;
        if (currentStreak > highest) {
          questData.progress.streak.highest = currentStreak;
        }
      }

      // NEW: Only increment step progress if we JUST reached the target
      if (newCurrent === target) {
        stepProgressIncrement = 1;
      }
    }

    // Update Title
    let newTitle = _task.title;

    // Robust cleanup: Remove all existing progress/streak patterns to prevent accumulation
    // We remove them globally from the string to catch cases like "(0/3) (1/3)"
    let baseTitle = _task.title.replace(/\s*🔥\s*\d+(\/\d+)?/g, '');
    baseTitle = baseTitle.replace(/\s*\(\d+\/\d+\)/g, '');
    baseTitle = baseTitle.trim();

    newTitle = baseTitle;

    if (target > 1) {
      newTitle = `${newTitle} (${newCurrent}/${target})`;
    }

    // Display Streak (Always show if configured)
    if (questData.progress?.streak) {
      const sCurrent = questData.progress.streak.current || 0;
      const sTarget = questData.progress.streak.target;

      let streakStr = `🔥 ${sCurrent}`;
      if (sTarget) {
        streakStr += `/${sTarget}`;
      }

      // If target exists, we always show "🔥 0/3". 
      // If no target, show only if current > 0? Or always "🔥 0"?
      // Let's adopt "Always show if present" as requested.
      if (sTarget || sCurrent > 0) {
        newTitle = `${newTitle} ${streakStr}`;
      }
    }

    taskUpdates = {
      isDone: isFinishedForDay,
      title: newTitle,
      notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
    };

    xpGained = questData.reward?.xp || 10;
    newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };

    // We do NOT return here anymore. We fall through to consolidate Step Completion checks.
    // BUT we must flag that we are a Habit and handled XP/Level logic already?
    // The Standard block adds XP if xpGained == 0. So we are safe there.
  }

  // --- STANDARD COMPLETION LOGIC ---
  // (Runs for Simple, Finished Grind, and processed Habit)

  // 1. Calculate XP (if not already handled)
  if (xpGained === 0) {
    const { xp } = parseXpTag(_task.title);
    xpGained = xp || 10;
    newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
  }

  // Check Level Up
  const levelResult = checkLevelUp(newState);
  newState = levelResult.newState;
  leveledUp = levelResult.leveledUp; // Merge with existing leveledUp? 
  // If habit caused level up, leveledUp is true. If not, this checks again. 
  // Actually checkLevelUp consumes XP. If habit called it, XP is low. 
  // Logic: 
  // Habit block: adds XP, calls checkLevelUp -> newState has level X, XP Y.
  // Standard block: `levelResult` calls checkLevelUp(newState).
  // If XP < target, nothing happens. Safe.

  // 2. Update Progress for this specific task
  if (currentStep) {
    const cleanForMatch = (t: string) => {
      let s = t.trim();
      s = s.replace(/\s*\(\d+\/\d+\)$/, '');
      s = s.replace(/\s*🔥\s*\d+(\/\d+)?$/, '');
      return s.toLowerCase();
    };

    const taskTitleClean = cleanForMatch(_task.title);
    const matchingDef = currentStep.tasksToCreate?.find(t => cleanForMatch(t.title) === taskTitleClean);

    // Determine increment
    let increment = 0;
    if (type === 'HABIT') {
      increment = stepProgressIncrement; // 0 or 1
    } else {
      // Simple or Finished Grind -> Always counts as 1 completion of the task *intention*
      increment = 1;
    }

    if (matchingDef && increment > 0) {
      // Use matchingDef.title as the key to ensure consistency irrespective of current task title state (suffixes)
      // This maps "Drink Water 2x @daily (1/2)" back to "Drink Water 2x @daily" key in progress map.
      const currentCount = newState.activeStory.taskProgress[matchingDef.title] || 0;
      newState.activeStory.taskProgress = {
        ...newState.activeStory.taskProgress,
        [matchingDef.title]: currentCount + increment
      };
    }
  }

  // 3. Check Step Completion & Boss Damage
  if (currentStep) {
    const requirement = currentStep.completion;

    if (requirement.type === 'boss_defeat') {
      // Boss Logic
      if (newState.activeBoss && !newState.activeBoss.isDead) {
        // If habit, do we deal damage? Yes, if it "Counts".
        // If increment > 0 (it was a meaningful completion), deal damage.
        // Or do strictly simple tasks deal damage? 
        // Usually Habits deal damage on completion.
        // Let's use `stepProgressIncrement` concept: if it contributed, it deals damage.
        // Use `stepProgressIncrement` for habits, `1` for others.

        let shouldDealDamage = true;
        if (type === 'HABIT' && stepProgressIncrement === 0) shouldDealDamage = false;

        if (shouldDealDamage) {
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
        stepCompleted = true; // Fallback?
      }
    }
  }

  return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
}
