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
    id: string | null; // e.g., 'story_productivity_mastery' or null if no active story
    currentStepId: number;
    tasksCreatedForStepId?: number | null;
    isCompleted?: boolean;
    taskProgress: Record<string, number>;
  };
  activeBoss: {
    hp: number;
    maxHp: number;
    isDead: boolean;
    name?: string;
    image?: string;
    themeColor?: string;
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
  // Rich Boss Features
  name?: string;
  image?: string; // URL or Asset ID
  themeColor?: string; // Hex code
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
