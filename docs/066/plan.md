# Plan 066: Core Logic (Regex Parsers)

## Goal

Implement the core regex parsers and data models required for Phase 1 of the "Headless RPG" architecture described in `docs/ROADMAP.md`. This includes parsing task titles for syntax like `[XP:100]`, `50x`, and `⚔️ Boss`, and defining the `QUEST_DATA` structure.

## Proposed Changes

### 1. Data Models (`src/types/quest-v2.ts`)

Create a new type file to host the v2 data models as per the Roadmap.

- `QuestTaskType`
- `QuestTaskData` (and sub-interfaces like `QuestTaskProgress`, `HabitRoutine`, `BossConfig`)
- `QuestTemplate` (Parsed result)

### 2. Parsers (`src/lib/parsers.ts`)

Implement parsing functions to extract metadata from titles.

- `parseXpTag(title: string): { xp: number | undefined, cleanTitle: string }`
  - Matches `[XP:123]`
- `parseTaskType(title: string): { type: QuestTaskType, meta: any, cleanTitle: string }`
  - Detects **Grind**: `50x Pushups` -> `type: GRIND`, `target: 50`
  - Detects **Habit**: `7x @daily Meditation` -> `type: HABIT`, `target: 7`, `frequency: @daily`
  - Detects **Boss**: `⚔️ Goblin [HP:500]` -> `type: BOSS`, `hp: 500`
- `compileTaskData(originalTitle: string): { title: string, data: QuestTaskData }`
  - Combines the above to produce the final payload for the task notes.

## Verification Plan

### Automated Tests

I will create a new test file `src/lib/parsers.test.ts` to verify the regex logic using `vitest` (or whatever test runner is configured, likely `jest` or `vitest`). I saw `game-logic.test.ts` so testing is supported.

#### Test Cases

1. **XP Tag**: `Chapter 1 [XP:100]` -> XP: 100, Title: `Chapter 1`
2. **Grind**: `50x Pushups` -> Type: GRIND, Target: 50, Title: `Pushups`
3. **Habit**: `3x @daily Read` -> Type: HABIT, Target: 3, Freq: @daily, Title: `Read`
4. **Boss**: `⚔️ Boss [HP:500]` -> Type: BOSS, HP: 500, Title: `Boss`
5. **Simple**: `Buy Milk` -> Type: SIMPLE, Title: `Buy Milk`

### Manual Verification

Since this is pure logic (Phase 1), implementation won't have a UI yet. I will rely on the unit tests.
