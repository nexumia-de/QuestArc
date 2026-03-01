import { processTaskCompletion, TaskStub } from "./game-logic";
import { QuestArcState } from "../types/state";
import { createInitialState } from "./state/persistence";
import { describe, test, expect, beforeEach } from "vitest";

describe("Custom Tag Damage Logic", () => {
  let state: QuestArcState;

  beforeEach(() => {
    state = createInitialState();
    if (!state.settings) {
      state.settings = { customTags: [] };
    }
    if (!state.settings.customTags.find((t) => t.tag === "#questarc")) {
      state.settings.customTags.push({
        id: "sys_questarc",
        tag: "#questarc",
        damage: 10,
        isSystem: true,
      });
    }

    // Set up an active boss
    state.activeBoss = {
      hp: 100,
      maxHp: 100,
      isDead: false,
    };
    state.activeStory = {
      ...state.activeStory,
      isCompleted: false,
    };
  });

  const mockBossStep = {
    id: 1,
    completion: {
      type: "boss_defeat" as const,
      config: { boss: { hp: 100, maxHp: 100 } },
    },
    xpReward: 100,
  };

  const mockNormalStep = {
    id: 2,
    completion: {
      type: "tasks_completed" as const,
      config: {},
    },
    xpReward: 50,
  } as any;

  test("Should apply custom damage using resolvedTagNames (Host App Tags)", () => {
    state.settings.customTags.push({
      id: "t1",
      tag: "#producitivity",
      damage: 15,
    });
    // Title does NOT have tag, but resolvedTagNames does (simulating tagId resolution)
    const task: TaskStub = {
      tagIds: ["tag_123"],
      title: "Work hard",
      resolvedTagNames: ["producitivity"], // "productivity" vs "#productivity" logic handles the #
    };

    const result = processTaskCompletion(
      state,
      task,
      mockNormalStep,
      undefined,
      false,
    );
    expect(result.damageDealt).toBeGreaterThanOrEqual(15);
  });

  test("Should apply custom damage when in Boss Step", () => {
    state.settings.customTags.push({ id: "t1", tag: "#gym", damage: 20 });
    const task: TaskStub = { tagIds: [], title: "Workout #gym" };

    const result = processTaskCompletion(
      state,
      task,
      mockBossStep,
      undefined,
      false,
    );
    expect(result.damageDealt).toBeGreaterThanOrEqual(20);
  });

  test("Should apply custom damage even in Non-Boss Step", () => {
    state.settings.customTags.push({ id: "t1", tag: "#gym", damage: 20 });
    const task: TaskStub = { tagIds: [], title: "Workout #gym" };

    // pass mockNormalStep (not boss_defeat)
    const result = processTaskCompletion(
      state,
      task,
      mockNormalStep,
      undefined,
      false,
    );
    expect(result.damageDealt).toBeGreaterThanOrEqual(20);
    expect(result.newState.activeBoss!.hp).toBeLessThan(100);
  });

  test("Should apply [dmg:N] even in Non-Boss Step", () => {
    const task: TaskStub = { tagIds: [], title: "Hard work [dmg:50]" };
    const result = processTaskCompletion(
      state,
      task,
      mockNormalStep,
      undefined,
      false,
    );
    expect(result.damageDealt).toBeGreaterThanOrEqual(50);
  });
});
