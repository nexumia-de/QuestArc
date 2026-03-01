import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskCompletionHandler } from "./TaskCompletionHandler";
import { PluginService } from "../services/PluginService";

// Mock PluginAPI global
const mockPluginAPI = {
  updateTask: vi.fn(),
  getTasks: vi.fn(),
  getAllProjects: vi.fn(),
};
(global as any).PluginAPI = mockPluginAPI;

// Mock PluginService
vi.mock("../services/PluginService", () => ({
  PluginService: {
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    showSnack: vi.fn(),
    get api() {
      return (global as any).PluginAPI;
    },
  },
}));

describe("TaskCompletionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockState: any = {
    activeStory: { isCompleted: false, currentStepId: 1, taskProgress: {} },
    profile: { xp: 0, level: 1 },
    stories: [
      {
        id: "test",
        steps: [{ id: 1, completion: { type: "tasks_completed" } }],
      },
    ],
  };

  const mockPayload: any = {
    task: {
      id: "t1",
      title: "Grind Task",
      tagIds: [],
      notes:
        '```json\n{"meta":{"type":"GRIND"},"progress":{"current":0,"target":3}}\n```',
    },
  };

  it("should call PluginAPI.updateTask with updates for Habits/Grinds", async () => {
    const saveCallback = vi.fn();
    await TaskCompletionHandler.handle(mockState, mockPayload, saveCallback);

    // Expect updateTask to be called
    expect(mockPluginAPI.updateTask).toHaveBeenCalled();

    // Expect notes to be updated to current: 1
    const updates = mockPluginAPI.updateTask.mock.calls[0][1];
    expect(updates).toBeDefined();
    if (updates) {
      expect(updates.notes).toContain('"current": 1');
    }

    // Expect isDone: false (keep unchecked)
    expect(updates?.isDone).toBe(false);

    // Expect saveCallback
    expect(saveCallback).toHaveBeenCalled();
  });

  it("should handle string payload by fetching task", async () => {
    const saveCallback = vi.fn();
    const taskId = "t2";
    const taskObj = {
      id: taskId,
      title: "Grind Task ID",
      tagIds: [],
      notes:
        '```json\n{"meta":{"type":"GRIND"},"progress":{"current":0,"target":3}}\n```',
    };

    // Mock getTasks to return our task
    mockPluginAPI.getTasks = vi.fn().mockResolvedValue([taskObj]);

    await TaskCompletionHandler.handle(mockState, taskId, saveCallback);

    expect(mockPluginAPI.getTasks).toHaveBeenCalled();
    expect(mockPluginAPI.updateTask).toHaveBeenCalledWith(
      taskId,
      expect.objectContaining({
        isDone: false,
      }),
    );
  });
  it("should DETECT sibling boss and deal damage (Dynamic Boss Context)", async () => {
    const saveCallback = vi.fn();

    // Setup: Sibling tasks (Boss + Worker)
    const parentId = "p1";
    const bossTask = {
      id: "boss1",
      title: "Dragon [HP:100]",
      parentId: parentId,
      isDone: false,
    };
    const workerTask = {
      id: "w1",
      title: "Attack",
      parentId: parentId,
      projectId: "proj1",
      isDone: true,
    };

    // Mock getTasks to return siblings
    mockPluginAPI.getTasks = vi.fn().mockResolvedValue([bossTask, workerTask]);

    // Mock getAllProjects to return a Quest Project (with 🧭)
    (PluginService.api as any).getAllProjects = vi
      .fn()
      .mockResolvedValue([{ id: "proj1", title: "My Quest 🧭" }]);

    // State with NO active boss and NO story
    const noBossState: any = {
      activeStory: { isCompleted: false, currentStepId: 999, taskProgress: {} }, // Invalid step
      profile: { xp: 0, level: 1 },
      stories: [],
      activeBoss: null,
    };

    // Mock Math.random to avoid crits (0.5 < 0.8)
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

    await TaskCompletionHandler.handle(
      noBossState,
      { task: workerTask },
      saveCallback,
    );

    // Expect activeBoss to be initialized in the NEW state passed to saveCallback
    const savedState = saveCallback.mock.calls[0][0];
    expect(savedState.activeBoss).not.toBeNull();
    expect(savedState.activeBoss?.name).toBe("Dragon");

    // Expect damage snackbar
    expect(PluginService.showSnack).toHaveBeenCalledWith(
      expect.stringContaining("Dealt 10 damage to Dragon"),
      "SUCCESS",
    );

    randomSpy.mockRestore();
  });
});
