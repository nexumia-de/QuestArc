import { QuestArcState, StoryStep } from '../types/state';
import { QuestTaskData } from '../types/quest-v2';

export interface TaskStub {
  tagIds: string[];
  title: string;
  notes?: string;
  resolvedTagNames?: string[]; // Tag names resolved from tagIds
}

// calculateDamage removed (deprecated)

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

import { CronHelper } from './cron';
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
    const result = processHabitProgress(questData, cleanTitle);

    // Check for block FIRST
    if (result.shouldBlock) {
      return {
        newState,
        damageDealt: 0,
        xpGained: 0,
        stepCompleted: false,
        leveledUp: false,
        shouldBlock: true,
        blockReason: result.blockReason || 'BLOCKED'
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

  // --- 1. explicit Damage Calculation (Tags & [dmg:N]) ---
  // This applies to ANY active boss, regardless of the current step type.
  let explicitDamage = 0;
  // customDamageTrigger already declared at top of function
  customDamageTrigger = false;
  let tagDamage = 0;
  let hasTagTrigger = false;
  const taskTitleLower = _task.title.toLowerCase();

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
  const damageEvery = questData.meta.damageEvery !== undefined ? questData.meta.damageEvery : 1; // Default: Every time (1)

  if (current < target) {
    const newCurrent = current + 1;
    if (!questData.progress) questData.progress = { current: 0, target };
    questData.progress.current = newCurrent;

    const isFinished = newCurrent >= target;
    const newTitle = formatTaskTitle(cleanTitle, questData.progress);

    // Damage Logic:
    // If damageEvery == 0, only on finish.
    // If damageEvery > 0, check modulus.
    let shouldDealDamage = false;
    if (damageEvery === 0) {
      shouldDealDamage = isFinished;
    } else {
      shouldDealDamage = (newCurrent % damageEvery === 0);
    }

    const updates = {
      isDone: isFinished,
      title: newTitle,
      notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
    };

    return { updates, isPartial: !isFinished, shouldDealDamage };
  }
  return null;
}

// Helper to strip dynamic tags for clean processing
function stripDynamicTags(title: string): string {
  // Removes [Next: ...] and [Due: ...] tags
  return title.replace(/\s*\[\s*(Next|Due):.*?\]/gi, '').trim();
}

function processHabitProgress(questData: QuestTaskData, cleanTitle: string) {
  const now = Date.now();

  // 0. Human Readable Date Override
  // If user manually edited "lastDoneDate" in JSON, use that as the source of truth for lastUpdated.
  let resolvedLastUpdated = questData.progress?.lastUpdated || 0;
  if (questData.progress?.lastDoneDate) {
    const manualDate = new Date(questData.progress.lastDoneDate);
    if (!isNaN(manualDate.getTime())) {
      resolvedLastUpdated = manualDate.getTime();
    }
  }
  const lastUpdated = resolvedLastUpdated;

  // Frequency Parsing
  const rawFreq = questData.meta.frequency || 'daily';
  // Use raw freq, CronHelper handles 'daily'/'weekly' aliases internally
  const freqExpression = rawFreq;

  const target = questData.progress?.target || 1;

  // --- 1. Missed Streak Logic ---
  if (questData.progress?.streak && lastUpdated > 0) {
    // Check if we missed any COMPLETE execution windows between last update and now.
    const missedCount = CronHelper.getOccurrencesBetween(freqExpression, lastUpdated, now);

    // If missedCount > 1, we missed at least one complete cycle boundary AND the window closed.
    // Example: Daily. Done Monday. Now Wednesday. MissedCount(Mon, Wed) = 2 (Tue, Wed). RESET.
    // Daily. Done Monday. Now Tuesday. MissedCount(Mon, Tue) = 1 (Tue). KEEP.
    if (missedCount > 1) {
      questData.progress.streak.current = 0;
      questData.progress.current = 0; // Reset daily progress too
    }
  } else if (lastUpdated === 0) {
    // First time initialization
    questData.progress = { ...questData.progress, current: 0 };
  }

  // --- 2. Double-Dip Guard (Anti-Cheat) ---
  const cyclesPassed = (lastUpdated > 0)
    ? CronHelper.getOccurrencesBetween(freqExpression, lastUpdated, now)
    : 1; // First time counts as new cycle

  console.log('[QuestArc Debug] DoubleDip Check:', {
    freq: freqExpression,
    lastUpdated: new Date(lastUpdated).toISOString(),
    now: new Date(now).toISOString(),
    cyclesPassed,
    current: questData.progress?.current,
    target
  });

  const freshCurrent = questData.progress?.current || 0;

  if (cyclesPassed === 0 && lastUpdated > 0) {
    // Same Cycle - Block second attempt
    if (freshCurrent >= target) {
      console.log('[QuestArc Debug] BLOCKING DoubleDip');
      return {
        updates: {}, // No updates needed
        stepIncrement: 0,
        xpGained: 0,
        shouldDealDamage: false,
        shouldBlock: true, // BLOCK and revert the tick
        blockReason: 'ALREADY_DONE_TODAY'
      };
    }
  } else if (cyclesPassed > 0) {
    // We crossed a cycle boundary, so we should reset current if not done already above
    if (questData.progress) questData.progress.current = 0;
  }

  // Re-read current after potential reset
  const actualCurrent = questData.progress?.current || 0;

  const damageEvery = questData.meta.damageEvery !== undefined ? questData.meta.damageEvery : 1;
  let stepIncrement = 0;

  const newCurrent = actualCurrent + 1;

  if (!questData.progress) questData.progress = { current: 0, target };

  questData.progress.current = newCurrent;
  questData.progress.lastUpdated = now;
  // Write Human Readable Date
  questData.progress.lastDoneDate = new Date(now).toISOString();

  const isFinishedForCycle = newCurrent >= target;

  // Damage Logic:
  let shouldDealDamage = false;
  if (damageEvery === 0) {
    shouldDealDamage = isFinishedForCycle;
  } else {
    shouldDealDamage = (newCurrent % damageEvery === 0);
  }

  if (isFinishedForCycle) {
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

  // 3. Sticky Streak Persistence
  // If the task has a streak TARGET, keep it OPEN (unchecked) until the target is met.
  let isDoneGlobal = isFinishedForCycle;
  if (questData.progress?.streak?.target) {
    const streakCurrent = questData.progress.streak.current || 0;
    const streakTarget = questData.progress.streak.target;
    if (streakCurrent < streakTarget) {
      isDoneGlobal = false; // Keep task open
    }
  }

  // 4. Next Run Indicator
  let nextRunTag = '';
  // Only show Next tag if the task is practically done for this cycle
  // (Note: processHabitProgress implies it IS a frequency/habit task)
  if (isFinishedForCycle) {
    const nextMs = CronHelper.getNextOccurrence(freqExpression, now);
    if (nextMs) {
      const nextDate = new Date(nextMs);
      const timeStr = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Use absolute day name (e.g. "Mon", "Tue") to avoid stale "Tomorrow" labels
      const dayStr = nextDate.toLocaleDateString([], { weekday: 'short' });

      nextRunTag = ` [Next: ${dayStr} ${timeStr}]`;
    }
  }

  // Debug Next Tag
  console.log('[QuestArc Debug] Next Tag Check:', { isFinishedForCycle, nextRunTag });

  // Apply stripDynamicTags to ensure we don't accumulate tags
  const newTitle = formatTaskTitle(stripDynamicTags(cleanTitle), questData.progress) + nextRunTag;

  const updates = {
    isDone: isDoneGlobal,
    title: newTitle,
    notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``
  };

  return { updates, stepIncrement, xpGained: 0, shouldDealDamage, shouldBlock: false };
}
