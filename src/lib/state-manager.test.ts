import { describe, it, expect } from "vitest";
import {
  createInitialState,
  migrateState,
  ensureState,
  updateXp,
  getActiveStory,
  getCurrentStep,
  getCurrentStepTitle,
  validateState,
  CURRENT_STATE_VERSION,
} from "./state-manager";
import {
  XP_PER_LEVEL_MULTIPLIER,
  PET_EVOLUTION_LEVEL_INTERVAL,
  PET_MAX_STAGE,
} from "./constants";

describe("state-manager", () => {
  describe("createInitialState", () => {
    it("should create a fresh state object", () => {
      const state = createInitialState();
      expect(state.version).toBe(CURRENT_STATE_VERSION);
      expect(state.profile.level).toBe(1);
      expect(state.profile.xp).toBe(0);
      expect(state.profile.pet.stage).toBe(1);
      expect(state.stories).toHaveLength(1);
    });

    it("should create independent state instances", () => {
      const state1 = createInitialState();
      const state2 = createInitialState();
      state1.profile.level = 10;
      expect(state2.profile.level).toBe(1);
    });
  });

  describe("validateState", () => {
    it("should validate a correct state", () => {
      const state = createInitialState();
      expect(validateState(state)).toBe(true);
    });

    it("should reject invalid states", () => {
      expect(validateState(null)).toBe(false);
      expect(validateState({})).toBe(false);
      expect(validateState({ profile: {} })).toBe(false);
      expect(validateState({ profile: { level: "invalid" } })).toBe(false);
    });
  });

  describe("migrateState", () => {
    it("should not modify state already at current version", () => {
      const state = createInitialState();
      const migrated = migrateState(state);
      expect(migrated.version).toBe(CURRENT_STATE_VERSION);
    });

    it("should migrate version 0 to version 1", () => {
      const oldState = { ...createInitialState(), version: 0 };
      const migrated = migrateState(oldState);
      expect(migrated.version).toBe(1);
    });

    it("should not mutate the input state", () => {
      const state = { ...createInitialState(), version: 0 };
      migrateState(state);
      expect(state.version).toBe(0); // Original unchanged
    });
  });

  describe("ensureState", () => {
    it("should add missing profile fields", () => {
      const incomplete: any = {
        stories: [],
        activeStory: { id: "test", currentStepId: 1, streakProgress: 0 },
      };
      const ensured = ensureState(incomplete);
      expect(ensured.profile).toBeDefined();
      expect(ensured.profile.hp).toBe(100);
      expect(ensured.profile.maxHp).toBe(100);
    });

    it("should add missing pet", () => {
      const state: any = {
        profile: { level: 1, xp: 0, xpToNextLevel: 100, hp: 100, maxHp: 100 },
        stories: [],
        activeStory: { id: "test", currentStepId: 1, streakProgress: 0 },
      };
      const ensured = ensureState(state);
      expect(ensured.profile.pet).toBeDefined();
      expect(ensured.profile.pet.stage).toBe(1);
    });

    it("should not mutate the input state", () => {
      const state: any = { stories: [] };
      const ensured = ensureState(state);
      expect(state.profile).toBeUndefined();
      expect(ensured.profile).toBeDefined();
    });
  });

  describe("updateXp", () => {
    it("should add XP without leveling up", () => {
      const state = createInitialState();
      const result = updateXp(state, 50);
      expect(result.state.profile.xp).toBe(50);
      expect(result.state.profile.level).toBe(1);
      expect(result.leveledUp).toBe(false);
    });

    it("should level up when XP threshold is reached", () => {
      const state = createInitialState();
      const result = updateXp(state, 100);
      expect(result.state.profile.level).toBe(2);
      expect(result.state.profile.xp).toBe(0);
      expect(result.state.profile.xpToNextLevel).toBe(
        2 * XP_PER_LEVEL_MULTIPLIER,
      );
      expect(result.leveledUp).toBe(true);
    });

    it("should handle multiple level ups", () => {
      const state = createInitialState();
      const result = updateXp(state, 350); // Level 1 (100) + Level 2 (200) + 50
      expect(result.state.profile.level).toBe(3);
      expect(result.state.profile.xp).toBe(50);
      expect(result.leveledUp).toBe(true);
    });

    it("should evolve pet at correct intervals", () => {
      const state = createInitialState();
      const xpToLevel5 = 100 + 200 + 300 + 400; // Levels 1->2, 2->3, 3->4, 4->5
      const result = updateXp(state, xpToLevel5);
      expect(result.state.profile.level).toBe(5);
      expect(result.state.profile.pet.stage).toBe(2); // Should evolve at level 5
    });

    it("should not evolve pet beyond max stage", () => {
      const state = createInitialState();
      state.profile.level = 14;
      state.profile.pet.stage = PET_MAX_STAGE;
      const result = updateXp(state, 1500);
      expect(result.state.profile.pet.stage).toBe(PET_MAX_STAGE);
    });

    it("should not mutate original state", () => {
      const state = createInitialState();
      const originalLevel = state.profile.level;
      updateXp(state, 100);
      expect(state.profile.level).toBe(originalLevel);
    });
  });

  describe("getActiveStory", () => {
    it("should return the active story", () => {
      const state = createInitialState();
      const story = getActiveStory(state);
      expect(story).toBeDefined();
      expect(story?.id).toBe(state.activeStory.id);
    });

    it("should return undefined for non-existent story", () => {
      const state = createInitialState();
      state.activeStory.id = "non-existent";
      const story = getActiveStory(state);
      expect(story).toBeUndefined();
    });
  });

  describe("getCurrentStep", () => {
    it("should return the current step", () => {
      const state = createInitialState();
      const step = getCurrentStep(state);
      expect(step).toBeDefined();
      expect(step?.id).toBe(state.activeStory.currentStepId);
    });

    it("should fall back to first step when step not found", () => {
      const state = createInitialState();
      state.activeStory.currentStepId = 9999; // Non-existent step
      const step = getCurrentStep(state);
      expect(step).toBeDefined();
      expect(step?.id).toBe(state.stories[0]?.steps[0]?.id);
    });

    it("should return undefined when no active story", () => {
      const state = createInitialState();
      state.activeStory.id = "non-existent";
      const step = getCurrentStep(state);
      expect(step).toBeUndefined();
    });

    it("should return undefined when story has no steps", () => {
      const state = createInitialState();
      state.stories[0]!.steps = [];
      const step = getCurrentStep(state);
      expect(step).toBeUndefined();
    });
  });

  describe("getCurrentStepTitle", () => {
    it("should return the current step title", () => {
      const state = createInitialState();
      const title = getCurrentStepTitle(state);
      expect(title).toBe(state.stories[0]?.steps[0]?.title);
    });

    it("should return fallback when step not found", () => {
      const state = createInitialState();
      state.activeStory.id = "non-existent";
      const title = getCurrentStepTitle(state);
      expect(title).toContain("NON");
      expect(title).toContain("EXISTENT");
    });
  });
});
