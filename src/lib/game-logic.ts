import { Modifier, QuestArcState, StoryStep } from '../types/state';
import { QuestTaskData } from '../types/quest-v2';
import { BASE_BOSS_DAMAGE } from './constants';

interface TaskStub {
  tagIds: string[];
  title: string;
  notes?: string;
}

export function calculateDamage(task: TaskStub, modifiers: Modifier[] = []): number {
  let multiplier = 1.0;

  for (const mod of modifiers) {
    if (mod.trigger.type === 'tag' && task.tagIds.includes(mod.trigger.value)) {
      multiplier *= mod.multiplier;
    }
  }

  return BASE_BOSS_DAMAGE * multiplier;
}

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

import { parseXpTag, compileTaskData, formatTaskTitle, cleanTaskTitle } from './parsers';
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
  let stepProgressIncrement = 0;

  if (state.activeStory.isCompleted) {
    return { newState, damageDealt: 0, xpGained: 0, stepCompleted: false, leveledUp: false };
  }

  let questData = getQuestData(_task);
  const type = questData.meta.type;

  // Clean title for matching logic
  const cleanTitle = cleanTaskTitle(_task.title);

  if (type === 'GRIND') {
    const result = processGrindProgress(questData, cleanTitle);
    if (result) {
      taskUpdates = result.updates;
      if (result.isPartial) {
        // Partial completion (n < target): Give 1 XP and return early
        xpGained = 1;
        newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
        return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
      }
      // If finished, fall through to full XP logic
    }
  } else if (type === 'HABIT') {
    const result = processHabitProgress(questData, cleanTitle);
    taskUpdates = result.updates;
    stepProgressIncrement = result.stepIncrement;
    xpGained = result.xpGained; // Habit specific XP logic (streak etc is handled in updates, but XP is distinct)
    // Actually, in original code, habit XP falls through to line 187: `xpGained = questData.reward?.xp || 10;`.
    // But wait, line 188: `newState.profile = ... + xpGained`.
    // My helper should probably not modify state directly but return XP.
    // Let's stick to the flow.
    if (result.xpGained > 0) {
      xpGained = result.xpGained;
      newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
    } else {
      // Validation: if result.xpGained is 0, it means we rely on fallthrough?
      // Original code line 187: `xpGained = questData.reward?.xp || 10`.
      // So we should set that here.
      xpGained = questData.reward?.xp || 10;
      newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
    }
  }

  // Fallback XP if not set (mostly for SIMPLE or GRIND completion)
  if (xpGained === 0) {
    const { xp } = parseXpTag(_task.title);
    xpGained = xp || 10;
    newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
  }

  const levelResult = checkLevelUp(newState);
  newState = levelResult.newState;
  leveledUp = levelResult.leveledUp;

  // Handle Parent Step Progress
  if (currentStep) {
    const taskTitleClean = cleanTitle.toLowerCase();

    // Find matching definition using clean title
    const matchingDef = currentStep.tasksToCreate?.find(t => cleanTaskTitle(t.title).toLowerCase() === taskTitleClean);

    let increment = (type === 'HABIT') ? stepProgressIncrement : 1;

    if (matchingDef && increment > 0) {
      const currentCount = newState.activeStory.taskProgress[matchingDef.title] || 0;
      newState.activeStory.taskProgress = {
        ...newState.activeStory.taskProgress,
        [matchingDef.title]: currentCount + increment
      };
    }
  }

  // Check Step Completion (Boss or Tasks)
  if (currentStep) {
    const requirement = currentStep.completion;

    if (requirement.type === 'boss_defeat') {
      if (newState.activeBoss && !newState.activeBoss.isDead) {
        let shouldDealDamage = true;
        // Habits only deal damage if they caused a step increment (completed daily target)
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
      // Check if all required tasks are done
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
  }

  return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
}

// --- Helper Functions ---

function getQuestData(task: TaskStub): QuestTaskData {
  let questData: QuestTaskData | null = null;
  if (task.notes) {
    try {
      const match = task.notes.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        questData = JSON.parse(match[1]);
      }
    } catch (e) { /* ignore */ }
  }

  if (!questData) {
    const compiled = compileTaskData(task.title);
    questData = compiled.data;
  }
  return questData!;
}

function processGrindProgress(questData: QuestTaskData, cleanTitle: string) {
  const current = questData.progress?.current || 0;
  const target = questData.progress?.target || 1;

  if (current < target) {
    const newCurrent = current + 1;
    // Safety check just in case
    if (!questData.progress) questData.progress = { current: 0, target };
    questData.progress.current = newCurrent;

    const isFinished = newCurrent >= target;

    const newTitle = formatTaskTitle(cleanTitle, questData.progress);

    const updates = {
      isDone: isFinished,
      title: newTitle,
      notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
    };

    return { updates, isPartial: !isFinished };
  }
  return null;
}

function processHabitProgress(questData: QuestTaskData, cleanTitle: string) {
  const current = questData.progress?.current || 0;
  const target = questData.progress?.target || 1;
  let stepIncrement = 0;

  const newCurrent = current + 1;
  const now = Date.now();

  if (!questData.progress) questData.progress = { current: 0, target };

  questData.progress.current = newCurrent;
  questData.progress.lastUpdated = now;

  const isFinishedForDay = newCurrent >= target;

  if (isFinishedForDay) {
    // Streak Logic
    if (newCurrent === target && questData.progress.streak) {
      questData.progress.streak.current = (questData.progress.streak.current || 0) + 1;
      const currentStreak = questData.progress.streak.current;
      const highest = questData.progress.streak.highest || 0;
      if (currentStreak > highest) {
        questData.progress.streak.highest = currentStreak;
      }
    }

    if (newCurrent === target) {
      stepIncrement = 1;
    }
  }

  const newTitle = formatTaskTitle(cleanTitle, questData.progress);

  const updates = {
    isDone: isFinishedForDay,
    title: newTitle,
    notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
  };

  return { updates, stepIncrement, xpGained: 0 }; // XP handled in main
}
