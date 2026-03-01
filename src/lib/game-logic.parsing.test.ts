import { describe, it, expect } from "vitest";
import { processTaskCompletion } from "./game-logic";
import { QuestArcState } from "../types/state";

describe("Game Logic Parsing Robustness", () => {
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

  const mockStep = {
    id: 1,
    completion: { type: "tasks_completed" },
  } as any;

  it("should parse standard code block with newlines", () => {
    const task = {
      tagIds: [],
      title: "Task",
      notes:
        '```json\n{"meta":{"type":"GRIND"},"progress":{"current":5,"target":10}}\n```',
    };
    const result = processTaskCompletion(mockState, task, mockStep);
    // Should increment to 6
    expect(result.taskUpdates?.notes).toContain('"current": 6');
  });

  it("should parse code block with missing newlines", () => {
    const task = {
      tagIds: [],
      title: "Task",
      notes:
        '```json{"meta":{"type":"GRIND"},"progress":{"current":5,"target":10}}```',
    };
    const result = processTaskCompletion(mockState, task, mockStep);
    expect(result.taskUpdates?.notes).toContain('"current": 6');
  });

  it("should parse raw JSON without code blocks", () => {
    const task = {
      tagIds: [],
      title: "Task",
      notes:
        'Some text before {"meta":{"type":"GRIND"},"progress":{"current":5,"target":10}} Some text after',
    };
    const result = processTaskCompletion(mockState, task, mockStep);
    expect(result.taskUpdates?.notes).toContain('"current": 6');
  });
});
