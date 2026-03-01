# Data Models

This document defines the core data structures used in QuestArc. These types are the "Source of Truth" for the application state.

> **Note**: User content (Stories, Tasks) is created in **Projects** and **Tasks**. The models below represent the _Internal Game State_ parsed from those user inputs.

## Core State (`QuestArcState`)

The root state object managed by the Brain and persisted to storage.

```typescript
export interface QuestArcState {
  version: number; // Schema version for migrations (e.g., 1)
  profile: HeroProfile; // Player stats
  stories: HeroStory[]; // Cached List of available stories (parsed from Templates)
  completedStories: CompletedStory[]; // History
  activeStory: ActiveStoryState; // Currently running quest
  activeBoss: ActiveBoss | null; // Currently fighting boss
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

The internal representation of a Quest, parsed from a **Project Template** (Title starts with `📜`).

```typescript
export interface HeroStory {
  id: string; // Derived from Project ID
  title: string; // Derived from Project Title
  steps: StoryStep[];
}

export interface StoryStep {
  id: number; // Step sequence ID (based on Task Order)
  title?: string; // Derived from Top-Level Task Title
  xpReward: number;
  nextStepId?: number | null; // ID of the next generic step

  // Tasks that define this step's requirements
  // Parsed from Subtasks of the Top-Level Task
  tasksToCreate?: TaskDefinition[];

  // What is required to finish this step?
  completion: CompletionRequirement;
}

export interface TaskDefinition {
  title: string; // Parsed from Subtask Title
  isAutoCreate: boolean; // usually true for required subtasks
  notes?: string;
  isRequired?: boolean;
  requiredCount?: number; // Parsed from [count:N]

  // Recurring config parsed from [freq:...]
  isRepeating?: boolean;
  repeatCfg?: {
    repeatEvery: number;
    repeatType: "DAILY" | "WEEKLY" | "MONTHLY";
  };
}
```

### QuestTaskData (Runtime Task Metadata)

Stored in task notes as a JSON block. Parsed from title tags during compilation.

```typescript
interface QuestTaskData {
  meta: {
    type: "SIMPLE" | "GRIND" | "HABIT" | "BOSS";
    version: number;
    originalTitle: string;
    sourceIndex?: number;
    damage?: number; // [dmg:N]
    damageEvery?: number; // [dmgevery:N]
    frequency?: string; // [freq:...]
    persistent?: string | boolean; // [persistent] or [persistent:Group]
    stack?: string; // [stack:ID] — habit chain identifier for cross-step stacking
  };
  progress?: {
    current: number;
    target?: number;
    lastDoneDate?: string;
    streak?: {
      current: number;
      target?: number;
      highest?: number;
      tier?: "bronze" | "silver" | "gold" | "diamond";
      totalCompletions?: number;
      availableGrace?: number;
    };
  };
}
```

---

## Boss Configuration (`BossConfig`)

Defines a boss enemy that can appear in a step. Parsed from `⚔️` tags in titles.

```typescript
export interface BossConfig {
  hp: number;
  maxHp: number;

  // Rich Visuals
  name?: string;
  image?: string; // URL or Asset ID
  themeColor?: string; // Hex code for UI theming

  // Dynamic Damage Logic
  damageModifiers: Modifier[];
  isDead?: boolean;
}

export interface Modifier {
  trigger: {
    type: "tag" | "project";
    value: string; // ID of the tag/project
  };
  multiplier: number; // Damage multiplier (e.g., 2.0 for double damage)
}
```

---

## Active State

### Active Story

Tracks the user's progress through the currently running instance of a Story.

```typescript
interface ActiveStoryState {
  id: string | null; // Project ID of the *Active* Project (copy of Template)
  currentStepId: number;
  tasksCreatedForStepId?: number | null; // Tracks if we already spawned tasks for this step
  isCompleted?: boolean;
  taskProgress: Record<string, number>; // Map of TaskID -> Progress count
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
