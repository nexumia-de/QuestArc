import { QuestArcState, StoryStep } from '../types/state';
import { QuestTaskData } from '../types/quest-v2';
// Constants removed - no longer needed
import { TaskStub } from '../types/plugin-api';

// calculateDamage removed (deprecated)

export function initializeBossIfNeeded(
  state: QuestArcState,
  currentStep: StoryStep
): QuestArcState {
  return BossLogic.initializeBossIfNeeded(state, currentStep);
}

import { XpLogic } from './logic/XpLogic';
import { BossLogic } from './logic/BossLogic';
import { StreakLogic } from './logic/StreakLogic';
import { NoteParser } from './parsers/NoteParser';
import { parseXpTag, compileTaskData, cleanTaskTitle } from './parsers';
import { Task } from '../types/plugin-api';

export function checkLevelUp(state: QuestArcState): { newState: QuestArcState; leveledUp: boolean } {
  return XpLogic.checkLevelUp(state);
}

export function processTaskCompletion(
  state: QuestArcState,
  _task: TaskStub,
  currentStep?: StoryStep,
  rootTask?: TaskStub,
  isQuestTask: boolean = false
): {
  newState: QuestArcState;
  damageDealt: number;
  xpGained: number;
  stepCompleted: boolean;
  leveledUp: boolean;
  taskUpdates?: Partial<Task>;
  shouldBlock?: boolean;
  blockReason?: string;
  blockMetadata?: any;
  explicitDamage?: number;
} {
  let damageDealt = 0;
  let xpGained = 0;
  let stepCompleted = false;
  let leveledUp = false;
  let taskUpdates: Partial<Task> | undefined;
  let newState = { ...state };
  let stepProgressIncrement = 0;
  let customDamageTrigger = false; // Flag to force damage even on partial completion

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
      customDamageTrigger = result.shouldDealDamage;

      if (result.isPartial) {
        // Partial completion (n < target): Give 1 XP
        xpGained = 1;
        newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };

        // Return EARLY unless we have custom damage to deal
        if (!customDamageTrigger) {
          return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates };
        }
        // If we DO have custom damage, we continue falling through to the damage block
      }
      // If finished, fall through to full XP logic
    }
  } else if (type === 'HABIT') {
    const result = processHabitProgress(questData, cleanTitle, state);

    // Check for block FIRST
    if (result.shouldBlock) {
      return {
        newState,
        damageDealt: 0,
        xpGained: 0,
        stepCompleted: false,
        leveledUp: false,
        shouldBlock: true,
        blockReason: result.blockReason || 'BLOCKED',
        blockMetadata: result.blockMetadata
      };
    }

    taskUpdates = result.updates;
    stepProgressIncrement = result.stepIncrement;
    xpGained = result.xpGained;
    customDamageTrigger = result.shouldDealDamage;

    if (result.xpGained > 0) {
      xpGained = result.xpGained;
      newState.profile = { ...newState.profile, xp: newState.profile.xp + xpGained };
    } else {
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

  // Handle Parent Step Progress (Quest V1)
  if (currentStep) {
    // ... existing logic ...
    const taskTitleClean = cleanTitle.toLowerCase();
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

  const taskTitleLower = _task.title.toLowerCase();

  // Explicit damage accumulated from [dmg:N] or tags
  let explicitDamage = 0;
  // customDamageTrigger already declared at top of function
  customDamageTrigger = false;
  let tagDamage = 0;
  let hasTagTrigger = false;


  // Check [dmg:N] (Highest Priority)
  // BUT: For Habits/Grinds, we must respect the internal 'shouldDealDamage' logic (cooldowns/double-dips).
  // If it's a simple task, we always trigger.
  if (questData.meta.damage !== undefined) {
    let applyDamage = true;
    if (type === 'HABIT' || type === 'GRIND') {
      if (!customDamageTrigger) applyDamage = false;
    }

    if (applyDamage) {
      explicitDamage = questData.meta.damage;
      customDamageTrigger = true;
    }
  }

  // Check Custom Tags (Check resolvedTagNames first, then fallback to title)
  if (state.settings?.customTags) {
    // 1. Check resolved tag names (from Super Productivity's tag system)
    const taskTagNames = _task.resolvedTagNames || [];
    const rootTagNames = rootTask?.resolvedTagNames || [];

    for (const configuredTag of state.settings.customTags) {
      // Strip # prefix for comparison if present
      const tagNameToMatch = configuredTag.tag.replace(/^#/, '').toLowerCase();

      // Check task's tags
      const taskMatch = taskTagNames.some(name => name.toLowerCase() === tagNameToMatch);
      if (taskMatch) {
        tagDamage = configuredTag.damage;
        hasTagTrigger = true;
        break;
      }

      // Check root's tags (inheritance)
      const rootMatch = rootTagNames.some(name => name.toLowerCase() === tagNameToMatch);
      if (rootMatch) {
        tagDamage = configuredTag.damage;
        hasTagTrigger = true;
        break;
      }
    }

    // 2. Fallback: Check title for inline hashtags (e.g., "Do task #questarc")
    if (!hasTagTrigger) {
      const matchingTag = state.settings.customTags.find(t => taskTitleLower.includes(t.tag.toLowerCase()));
      if (matchingTag) {
        tagDamage = matchingTag.damage;
        hasTagTrigger = true;
      } else if (rootTask) {
        const rootTitleLower = rootTask.title.toLowerCase();
        const rootMatchingTag = state.settings.customTags.find(t => rootTitleLower.includes(t.tag.toLowerCase()));
        if (rootMatchingTag) {
          tagDamage = rootMatchingTag.damage;
          hasTagTrigger = true;
        }
      }
    }
  }

  // Fallback for missing settings (migration edge case) for legacy #questarc
  if (!state.settings && (taskTitleLower.includes('#questarc') || rootTask?.title.toLowerCase().includes('#questarc'))) {
    tagDamage = 10;
    hasTagTrigger = true;
  }

  // Determine final Explicit Damage
  if (!customDamageTrigger && hasTagTrigger) {
    explicitDamage = tagDamage;
  }

  // Apply Explicit Damage to Active Boss
  if (explicitDamage > 0 && newState.activeBoss && !newState.activeBoss.isDead) {
    const isCrit = Math.random() > 0.8;
    const finalDmg = isCrit ? explicitDamage * 2 : explicitDamage;

    damageDealt += finalDmg; // Accumulate damage
    newState.activeBoss = {
      ...newState.activeBoss,
      hp: Math.max(0, newState.activeBoss.hp - finalDmg),
    };

    if (newState.activeBoss.hp === 0) {
      newState.activeBoss.isDead = true;
      // Note: Step completion check will happen below if we are in a boss step
    }
  }


  // --- 2. Step Completion Logic ---
  // Check Step Completion (Boss or Tasks)
  if (currentStep) {
    const requirement = currentStep.completion;

    if (requirement.type === 'boss_defeat') {
      // If boss is dead (possibly killed just now by explicit damage), we complete.
      if (newState.activeBoss && newState.activeBoss.isDead) {
        stepCompleted = true;
      }
      else if (newState.activeBoss && !newState.activeBoss.isDead) {
        // Boss still alive. Check if we should deal STANDARD/IMPLICIT damage.
        // Rule: If we just dealt explicit damage, we DON'T deal standard damage (prevent double dip).
        // Standard damage applies if: isQuestTask OR #questarc (but #questarc is now explicit via system tag).
        // So really, "Standard Damage" is just for Tasks belonging to the Quest Project that DON'T have a tag.

        if (damageDealt === 0) { // Only if we haven't damaged it yet
          // 1. Tag Check: Relaxed for dynamic boss (isQuestTask=true) 
          // Logic: If isQuestTask is true, we deal default 10 damage.
          let shouldDealStandardDamage = true;

          if (!isQuestTask) {
            shouldDealStandardDamage = false;
          }

          // Habit/Grind Check (Optimization: Don't spam damage if not completed)
          if (type === 'HABIT' && stepProgressIncrement === 0) shouldDealStandardDamage = false;

          if (shouldDealStandardDamage) {
            const baseDamage = 10;
            const isCrit = Math.random() > 0.8;
            const implicitDmg = isCrit ? baseDamage * 2 : baseDamage;

            damageDealt += implicitDmg;
            newState.activeBoss = {
              ...newState.activeBoss,
              hp: Math.max(0, newState.activeBoss.hp - implicitDmg),
            };
            if (newState.activeBoss.hp === 0) {
              newState.activeBoss.isDead = true;
              stepCompleted = true;
            }
          }
        }
      }
    } else if (requirement.type === 'tasks_completed') {
      // ... existing logic ...
      const tasks = currentStep.tasksToCreate || [];
      const requiredTasks = tasks.filter(t => t.isRequired !== false);
      const allMet = requiredTasks.every(def => {
        const progress = newState.activeStory.taskProgress[def.title] || 0;
        const target = def.requiredCount || 1;
        return progress >= target;
      });
      if (requiredTasks.length > 0 && allMet) stepCompleted = true;
      else if (requiredTasks.length === 0) stepCompleted = true;
    }
  }

  return { newState, damageDealt, xpGained, stepCompleted, leveledUp, taskUpdates, explicitDamage };
}

// --- Helper Functions ---

function getQuestData(task: TaskStub): QuestTaskData {
  return NoteParser.getQuestData(task, compileTaskData);
}

function processGrindProgress(questData: QuestTaskData, cleanTitle: string) {
  return StreakLogic.processGrindProgress(questData, cleanTitle);
}

function processHabitProgress(questData: QuestTaskData, cleanTitle: string, state: QuestArcState) {
  return StreakLogic.processHabitProgress(questData, cleanTitle, state.settings?.streakBehavior);
}
