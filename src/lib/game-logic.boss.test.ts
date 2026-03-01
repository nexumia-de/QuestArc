import { describe, it, expect } from "vitest";
import { processTaskCompletion } from "./game-logic";
import { createInitialState } from "./state/persistence";
import { StoryStep } from "../types/state";

describe("Boss Logic Rules", () => {
  it("should deal damage if task has #questarc tag in title", () => {
    let state = createInitialState();

    // Setup Active Boss
    state.activeBoss = {
      hp: 100,
      maxHp: 100,
      isDead: false,
    };

    // Mock Step requiring Boss Defeat
    const bossStep: StoryStep = {
      id: 1,
      title: "Boss Battle",
      completion: {
        type: "boss_defeat",
      },
      xpReward: 100,
    };

    const result = processTaskCompletion(
      state,
      {
        id: "t1",
        title: "Task with tag #QuestArc",
        isDone: true,
        tagIds: [],
        notes: "",
      } as any,
      bossStep,
    );

    const newState = result.newState;

    expect(result.damageDealt).toBeGreaterThan(0);
    expect(newState.activeBoss!.hp).toBeLessThan(100);
  });

  it("should NOT deal damage if task is missing #questarc tag", () => {
    let state = createInitialState();

    state.activeBoss = {
      hp: 100,
      maxHp: 100,
      isDead: false,
    };

    const bossStep: StoryStep = {
      id: 1,
      title: "Boss Battle",
      completion: {
        type: "boss_defeat",
        config: { boss: state.activeBoss },
      },
      xpReward: 100,
    };

    const result = processTaskCompletion(
      state,
      {
        id: "t2",
        title: "Regular Task",
        isDone: true,
        tagIds: [],
        notes: "",
      } as any,
      bossStep,
    );

    expect(result.damageDealt).toBe(0);
    expect(result.newState.activeBoss!.hp).toBe(100);
  });

  it("should verify case insensitivity for #questarc", () => {
    let state = createInitialState();

    state.activeBoss = {
      hp: 100,
      maxHp: 100,
      isDead: false,
    };

    const bossStep: StoryStep = {
      id: 1,
      title: "Boss Battle",
      completion: { type: "boss_defeat" },
      xpReward: 100,
    };

    const result = processTaskCompletion(
      state,
      {
        id: "t3",
        title: "Task with #QuEsTaRc tag",
        isDone: true,
        tagIds: [],
        notes: "",
      } as any,
      bossStep,
    );

    expect(result.damageDealt).toBeGreaterThan(0);
  });
});
