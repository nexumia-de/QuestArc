export interface CompletedStory extends HeroStory {
  completedAt: number;
}

export interface AvatarConfig {
  skinColor: string;
  bgColor: string;
  eyes: 'neutral' | 'happy' | 'tired' | 'focus' | 'angry';
  mouth: 'neutral' | 'smile' | 'frown' | 'surprised';
}

export interface CustomTagConfig {
  id: string;
  tag: string;
  damage: number;
  isSystem?: boolean;
}

export interface FrequencyAliasConfig {
  id: string;
  alias: string; // e.g., "workdays"
  cron: string;  // e.g., "0 0 * * 1-5"
  isSystem?: boolean; // Built-in aliases are read-only
}

export type StreakTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface StreakBehaviorConfig {
  gracePeriodsPerCycle?: number;   // Default: 1 - free misses before decay
  decayPercent?: number;           // Default: 25 - % of streak lost on miss
  useTiers?: boolean;              // Default: true - enable milestone floors
  tierFloors?: {
    bronze: number;   // Default: 0
    silver: number;   // Default: 7
    gold: number;     // Default: 30
    diamond: number;  // Default: 60
  };
  defaultGraceCron?: string; // Optional: Cron schedule for bonus grace accumulation
}

export interface QuestArcState {
  version: number; // Schema version for migrations
  settings: {
    customTags: CustomTagConfig[];
    customFrequencyAliases?: FrequencyAliasConfig[]; // User-defined frequency aliases
    streakBehavior?: StreakBehaviorConfig; // Streak motivation settings
  };
  profile: {
    level: number;
    xp: number;
    xpToNextLevel: number; // e.g., level * 100
    hp: number;
    maxHp: number;
    pet?: {
      type: string;
      stage: number;
      name: string;
    };
    avatar: AvatarConfig;
  };
  stories: HeroStory[];
  completedStories: CompletedStory[];
  activeStory: {
    id: string | null; // e.g., 'story_productivity_mastery' or null if no active story
    sourceTemplateId?: string | null; // ID of the template project this was created from
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

export interface BossConfig {
  hp: number;
  maxHp: number;
  // damageModifiers removed
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
  title?: string;

  tasksToCreate?: TaskDefinition[];
  completion: CompletionRequirement;

  xpReward: number;
  nextStepId?: number | null;

  // Visual / Narrative Fields
  flavor_text?: string;
  summary_text?: string; // For collapsed mode
  story_icon?: string;   // Custom icon/emoji
  display_mode?: 'visible' | 'collapsed' | 'tooltip';
  environment_theme?: string;
}

export interface HeroStory {
  id: string;
  title: string;
  steps: StoryStep[];
}
