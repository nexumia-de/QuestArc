# Technical Concept: QuestArc Engine ⚙️

## 1. Data Structures

### The Global State (`QuestArcState`)

This is the object persisted in `plugin.saveData()`.

```typescript
interface QuestArcState {
  profile: {
    level: number;
    xp: number;
    xpToNextLevel: number; // e.g., level * 100
  };
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
```

### The Static Story Data (`HeroStory`)

Loaded from JSON files, not persisted in save data.

```typescript
interface HeroStory {
  id: string;
  steps: StoryStep[];
}

type StoryStep =
  | { type: 'simple', condition: { type: 'streak', target: number }, ... }
  | { type: 'boss', boss: { hp: number, modifiers: Modifier[] }, ... };

```

## 2. The Logic Engine (`plugin.ts`)

### The Event Loop

1. **Trigger:** `plugin.on('taskComplete', (task) => ...)`
2. **Filter:** Is a Boss active? Is a Streak active?
3. **Calculation:**

- **Streak:** `state.activeStory.streakProgress++`. Check if `streakProgress >= target`.
- **Boss:** `damage = baseDamage * getModifiers(task)`. `boss.hp -= damage`.

4. **Update:** Save new state to JSON.
5. **Broadcast:**

- Update Header Button: `❤️ ${hp}`.
- Send Message to UI: `postMessage({ type: 'BOSS_HIT', damage })`.

### Damage Logic

Base Damage = 10.
Modifiers are multiplicative.

```typescript
function calculateDamage(task: Task, modifiers: Modifier[]): number {
  let multiplier = 1.0;
  for (const mod of modifiers) {
    if (mod.trigger.type === "tag" && task.tagIds.includes(mod.trigger.value)) {
      multiplier *= mod.multiplier;
    }
  }
  return 10 * multiplier;
}
```

## 3. Communication Protocol

The IFrame and Background communicate via strictly typed messages.

| Direction       | Type           | Payload                | Purpose                            |
| --------------- | -------------- | ---------------------- | ---------------------------------- |
| **Brain -> UI** | `STATE_SYNC`   | `QuestArcState`        | Full state replace on load/update. |
| **Brain -> UI** | `BOSS_HIT`     | `{ damage: number }`   | Trigger "hit" animation.           |
| **Brain -> UI** | `LEVEL_UP`     | `{ newLevel: number }` | Trigger confetti.                  |
| **UI -> Brain** | `REQUEST_SYNC` | `null`                 | IFrame asking for initial state.   |
| **UI -> Brain** | `DEV_RESET`    | `null`                 | Reset state to zero (Debug).       |
