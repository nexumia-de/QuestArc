import { Modifier, QuestArcState, StoryStep } from '../types/state';

interface TaskStub {
  tagIds: string[];
  title: string;
}

export function calculateDamage(task: TaskStub, modifiers: Modifier[] = []): number {
  let multiplier = 1.0;
  const baseDamage = 10;

  for (const mod of modifiers) {
    if (mod.trigger.type === 'tag' && task.tagIds.includes(mod.trigger.value)) {
      multiplier *= mod.multiplier;
    }
  }

  return baseDamage * multiplier;
}

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
