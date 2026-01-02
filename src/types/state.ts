export interface QuestArcState {
  version: number; // Schema version for migrations
  profile: {
    level: number;
    xp: number;
    xpToNextLevel: number; // e.g., level * 100
    hp: number;
    maxHp: number;
    pet: {
      type: string;
      stage: number;
      name: string;
    };
  };
  stories: HeroStory[];
  activeStory: {
    id: string; // e.g., 'story_productivity_mastery'
    currentStepId: number;
    streakProgress: number; // Current counter for 'streak' steps
  };
  activeBoss: {
    hp: number;
    maxHp: number;
    isDead: boolean;
  } | null;
}

export type ModifierTriggerType = 'tag' | 'project';

export interface ModifierTrigger {
  type: ModifierTriggerType;
  value: string;
}

export interface Modifier {
  trigger: ModifierTrigger;
  multiplier: number;
}

export interface BossConfig {
  hp: number;
  maxHp: number;
  damageModifiers: Modifier[];
  isDead?: boolean;
}

export interface TaskDefinition {
  title: string;
  isAutoCreate: boolean;
  notes?: string;

  // Recurring Task Fields
  isRepeating?: boolean;
  repeatCfg?: {
    repeatEvery: number;
    repeatType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  };

  // Requirement Fields
  isRequired?: boolean;
  requiredCount?: number;
}

export type CompletionType = 'tasks_completed' | 'boss_defeat';

export interface CompletionRequirement {
  type: CompletionType;
  config?: {
    boss?: BossConfig;
  };
}

export interface StoryStep {
  id: number;
  title: string;

  tasksToCreate?: TaskDefinition[];
  completion: CompletionRequirement;

  xpReward: number;
  nextStepId?: number | null;
}

export interface HeroStory {
  id: string;
  title: string;
  steps: StoryStep[];
}
