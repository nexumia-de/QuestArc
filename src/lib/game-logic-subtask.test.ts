import { describe, it, expect } from "vitest";
import { processTaskCompletion } from "./game-logic";
import { QuestArcState } from "../types/state";

describe("Subtask Logic", () => {
  const mockState: QuestArcState = {
    version: 1,
    profile: {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      hp: 100,
      maxHp: 100,
      avatar: { skinColor: "", bgColor: "", eyes: "neutral", mouth: "neutral" },
    },
    stories: [],
    completedStories: [],
    activeStory: { id: "test", currentStepId: 1, taskProgress: {} },
    activeBoss: null,
  };

  it("should update title for Grind task on progress", () => {
    // Mock a task that corresponds to "50x Pushups"
    // Initial state: Title has count (0/50), QuestData current=0
    const initialTitle = "Pushups (0/50)";
    const questData = {
      meta: { type: "GRIND", version: 1, originalTitle: "50x Pushups" },
      progress: { current: 0, target: 50 },
      reward: { xp: 1 },
    };
    const notes = `\`\`\`json\n${JSON.stringify(questData)}\n\`\`\``;

    const taskStub = {
      tagIds: [],
      title: initialTitle,
      notes: notes,
    };

    const result = processTaskCompletion(mockState, taskStub);

    expect(result.taskUpdates).toBeDefined();
    // Should increment to 1
    expect(result.taskUpdates?.title).toContain("(1/50)");
    expect(result.taskUpdates?.isDone).toBe(false);
  });

  it("should update title for Habit task on progress", () => {
    // Mock a "3x @daily Drink" task
    const initialTitle = "Drink (0/3)";
    const questData = {
      meta: { type: "HABIT", version: 1, originalTitle: "3x @daily Drink" },
      progress: { current: 0, target: 3 },
      routine: { frequency: "@daily", lastDone: null },
    };
    const notes = `\`\`\`json\n${JSON.stringify(questData)}\n\`\`\``;

    const taskStub = {
      tagIds: [],
      title: initialTitle,
      notes: notes,
    };

    const result = processTaskCompletion(mockState, taskStub);

    expect(result.taskUpdates).toBeDefined();
    // Should increment to 1
    expect(result.taskUpdates?.title).toContain("(1/3)");
    expect(result.taskUpdates?.isDone).toBe(false);
  });
});
