import { Modifier, QuestArcState, StoryStep } from '../types/state';
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

  let questData = null;
  if (_task.notes) {
    try {
      const match = _task.notes.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        questData = JSON.parse(match[1]);
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

  if (type === 'GRIND') {
    const current = questData.progress?.current || 0;
    const target = questData.progress?.target || 1;

    if (current < target) {
      const newCurrent = current + 1;
      questData.progress.current = newCurrent;

      const isFinished = newCurrent >= target;

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
    }
  } else if (type === 'HABIT') {
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

      if (newCurrent === target) {
        stepProgressIncrement = 1;
      }
    }

    let newTitle = _task.title;

    let baseTitle = _task.title.replace(/\s*🔥\s*\d+(\/\d+)?/g, '');
    baseTitle = baseTitle.replace(/\s*\(\d+\/\d+\)/g, '');
    baseTitle = baseTitle.trim();

    newTitle = baseTitle;

    if (target > 1) {
      newTitle = `${newTitle} (${newCurrent}/${target})`;
    }

    if (questData.progress?.streak) {
      const sCurrent = questData.progress.streak.current || 0;
      const sTarget = questData.progress.streak.target;

      let streakStr = `🔥 ${sCurrent}`;
      if (sTarget) {
        streakStr += `/${sTarget}`;
      }

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
  }

  if (xpGained === 0) {
    const { xp } = parseXpTag(_task.title);
    xpGained = xp || 10;
    newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
  }

  const levelResult = checkLevelUp(newState);
  newState = levelResult.newState;
  leveledUp = levelResult.leveledUp;

  if (currentStep) {
    const cleanForMatch = (t: string) => {
      let s = t.trim();
      s = s.replace(/\s*\(\d+\/\d+\)$/, '');
      s = s.replace(/\s*🔥\s*\d+(\/\d+)?$/, '');
      return s.toLowerCase();
    };

    const taskTitleClean = cleanForMatch(_task.title);
    const matchingDef = currentStep.tasksToCreate?.find(t => cleanForMatch(t.title) === taskTitleClean);

    let increment = 0;
    if (type === 'HABIT') {
      increment = stepProgressIncrement;
    } else {
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

  if (currentStep) {
    const requirement = currentStep.completion;

    if (requirement.type === 'boss_defeat') {
      if (newState.activeBoss && !newState.activeBoss.isDead) {
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
