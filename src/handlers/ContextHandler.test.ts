import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContextHandler } from "./ContextHandler";
import { PluginService } from "../services/PluginService";

// Mock Globals
const mockPluginAPI = {
  getTasks: vi.fn(),
};
(global as any).PluginAPI = mockPluginAPI;

vi.mock("../services/PluginService", () => ({
  PluginService: {
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    get api() {
      return (global as any).PluginAPI;
    },
  },
}));

describe("ContextHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockState: any = {
    activeStory: { isCompleted: false },
    profile: { xp: 0 },
    activeBoss: null,
  };

  it("should detect Sibling Boss and set activeBoss", async () => {
    const saveCallback = vi.fn();
    const parentId = "p1";

    const tasks = [
      { id: "w1", title: "Worker", parentId },
      { id: "b1", title: "Dragon [HP: 100]", parentId },
    ];

    mockPluginAPI.getTasks.mockResolvedValue(tasks);

    await ContextHandler.handle("w1", mockState, saveCallback);

    expect(saveCallback).toHaveBeenCalled();
    const newState = saveCallback.mock.calls[0][0];
    expect(newState.activeBoss).toBeDefined();
    expect(newState.activeBoss.name).toBe("Dragon");
    expect(newState.activeBoss.hp).toBe(100);
  });

  it("should detect Self as Boss and set activeBoss", async () => {
    const saveCallback = vi.fn();
    const parentId = "p1";

    const tasks = [{ id: "b1", title: "Dragon [HP: 100]", parentId }];

    mockPluginAPI.getTasks.mockResolvedValue(tasks);

    await ContextHandler.handle("b1", mockState, saveCallback);

    expect(saveCallback).toHaveBeenCalled();
    const newState = saveCallback.mock.calls[0][0];
    expect(newState.activeBoss).toBeDefined();
    expect(newState.activeBoss.name).toBe("Dragon");
  });

  it("should NOT overwrite existing boss if name is same (preserve HP)", async () => {
    const saveCallback = vi.fn();
    const parentId = "p1";

    const tasks = [
      { id: "w1", title: "Worker", parentId },
      { id: "b1", title: "Dragon [HP: 100]", parentId },
    ];

    mockPluginAPI.getTasks.mockResolvedValue(tasks);

    // State has Dragon with 50 HP (damaged)
    const damagedState = {
      ...mockState,
      activeBoss: { name: "Dragon", hp: 50, maxHp: 100, isDead: false },
    };

    await ContextHandler.handle("w1", damagedState, saveCallback);

    // Should NOT call saveCallback (no change needed) OR call with same state?
    // Logic says: if (!state.activeBoss || state.activeBoss.name !== bossMs.name)
    // Names match ('Dragon' === 'Dragon'), so it skips the update.
    expect(saveCallback).not.toHaveBeenCalled();
  });
});
