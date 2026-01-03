# Data Models

This document defines the core data structures used in QuestArc. These types are the "Source of Truth" for the application state.

## Core State (`QuestArcState`)

The root state object managed by the Brain and persisted to storage.

```typescript
export interface QuestArcState {
  version: number;         // Schema version for migrations (e.g., 1)
  profile: HeroProfile;    // Player stats
  stories: HeroStory[];    // List of available stories
  completedStories: CompletedStory[]; // History
  activeStory: ActiveStoryState;      // Currently running quest
  activeBoss: ActiveBoss | null;      // Currently fighting boss
}
```

### Hero Profile
```typescript
interface HeroProfile {
  level: number;
  xp: number;
  xpToNextLevel: number; // calculated as level * 100
  hp: number;
  maxHp: number;
  pet: {
    type: string;
    stage: number;
    name: string;
  };
}
```

---

## Story Data (`HeroStory`)

The static definition of a Quest.

```typescript
export interface HeroStory {
  id: string;        // Unique ID (e.g., "story_morning_routine")
  title: string;     // Display title
  steps: StoryStep[];
}

export interface StoryStep {
  id: number;        // Step sequence ID (1, 2, 3...)
  title?: string;
  xpReward: number;
  nextStepId?: number | null; // ID of the next step, or null if end of story

  // Tasks to inject into Super Productivity
  tasksToCreate?: TaskDefinition[];
  
  // What is required to finish this step?
  completion: CompletionRequirement;
}

export interface TaskDefinition {
  title: string;
  isAutoCreate: boolean;  // If true, created immediately when step starts
  notes?: string;
  isRequired?: boolean;
  requiredCount?: number;
  
  // Recurring config
  isRepeating?: boolean;
  repeatCfg?: {
    repeatEvery: number;
    repeatType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  };
}
```

---

## Boss Configuration (`BossConfig`)

Defines a boss enemy that can appear in a step.

```typescript
export interface BossConfig {
  hp: number;
  maxHp: number;
  
  // Rich Visuals
  name?: string;
  image?: string;       // URL or Asset ID
  themeColor?: string;  // Hex code for UI theming

  // Dynamic Damage Logic
  damageModifiers: Modifier[];
  isDead?: boolean;
}

export interface Modifier {
  trigger: {
    type: 'tag' | 'project';
    value: string; // ID of the tag/project
  };
  multiplier: number; // Damage multiplier (e.g., 2.0 for double damage)
}
```

---

## Active State

### Active Story
```typescript
interface ActiveStoryState {
  id: string | null;            // Null if no active quest
  currentStepId: number;
  tasksCreatedForStepId?: number | null; // Tracks if we already spawned tasks for this step
  isCompleted?: boolean;
  taskProgress: Record<string, number>;  // Map of TaskID -> Progress count
}
```

### Active Boss
The runtime instance of a boss.
```typescript
interface ActiveBoss {
  hp: number;
  maxHp: number;
  isDead: boolean;
  name?: string;
  image?: string;
  themeColor?: string;
}
```
