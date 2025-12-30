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
  state: QuestArcState,
  task: TaskStub,
  currentStep: StoryStep
): { newState: QuestArcState; damageDealt: number; stepCompleted: boolean } {
  let damageDealt = 0;
  let stepCompleted = false;

  // Handle Boss logic
  if (currentStep.type === 'boss' && state.activeBoss) {
    damageDealt = calculateDamage(task, currentStep.boss?.damageModifiers);
    state.activeBoss.hp -= damageDealt;
    
    if (state.activeBoss.hp <= 0) {
      state.activeBoss.hp = 0;
      state.activeBoss.isDead = true;
      stepCompleted = true;
    }
  } 
  // Handle Streak logic
  else if (currentStep.condition?.type === 'streak') {
    state.activeStory.streakProgress += 1;
    if (state.activeStory.streakProgress >= currentStep.condition.target) {
      stepCompleted = true;
    }
  }
  // Handle Simple logic (count or just completion)
  else {
    stepCompleted = true;
  }

  return { newState: state, damageDealt, stepCompleted };
}
