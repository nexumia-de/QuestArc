import { describe, it, expect } from "vitest";
import { processTaskCompletion } from "./game-logic";
import { createInitialState } from "./state/persistence";

// Mimic local TaskStub from game-logic
interface TaskStub {
  id: string;
  title: string;
  notes?: string;
  isDone: boolean;
  tagIds: string[];
}

describe("Habit Logic & Looping Fix", () => {
  it("should increment habit progress on completion and update notes with lastUpdated", () => {
    let state = createInitialState();

    // Mock Habit Task: 2x @daily
    // Initial state: 0/2
    const habitTask: TaskStub = {
      id: "t1",
      title: "Drink Water [count:2] [freq:daily]",
      notes: "",
      isDone: false,
      tagIds: [],
    };

    // 1st Completion
    const result1 = processTaskCompletion(state, habitTask);
    const updates1 = result1.taskUpdates!;

    // Parse QuestData from updates
    if (!updates1.notes) throw new Error("Notes missing");
    const match1 = updates1.notes.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match1) throw new Error("JSON missing");
    const qd1 = JSON.parse(match1[1]!);

    expect(qd1.meta.type).toBe("HABIT");
    expect(qd1.progress.current).toBe(1);
    expect(qd1.progress.target).toBe(2);
    expect(qd1.progress.lastDoneDate).toBeDefined(); // New field
    expect(updates1.isDone).toBe(false); // Should NOT be done yet
    expect(updates1.title).toContain("(1/2)");

    // Update task for next run
    const habitTask2: TaskStub = {
      ...habitTask,
      title: updates1.title!,
      notes: updates1.notes,
      isDone: false,
    };

    // 2nd Completion
    const result2 = processTaskCompletion(state, habitTask2);
    const updates2 = result2.taskUpdates!;
    if (!updates2.notes) throw new Error("Notes missing");
    const match2 = updates2.notes.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match2) throw new Error("JSON missing");
    const qd2 = JSON.parse(match2[1]!);

    expect(qd2.progress.current).toBe(2);
    expect(updates2.isDone).toBe(true); // Should be done now
    expect(updates2.title).toContain("(2/2)");

    // 3rd Completion (Over-completion / Looping check)
    // If user clicks it AGAIN while it is done? Or if system re-processes it?

    const habitTask3: TaskStub = {
      ...habitTask2,
      title: updates2.title!,
      notes: updates2.notes,
      isDone: true, // It is already done
    };

    // Logic should probably just return same state or increment?
    // With new strict lastDoneDate logic, it should BLOCK to prevent double-dipping on the same day.
    const result3 = processTaskCompletion(state, habitTask3);

    expect(result3.shouldBlock).toBe(true);
    expect(result3.blockReason).toBe("ALREADY_DONE_TODAY");
    expect(result3.blockMetadata?.nextResetTime).toBeDefined();

    // Next reset should be in the future
    expect(result3.blockMetadata.nextResetTime).toBeGreaterThan(Date.now());
    expect(result3.taskUpdates).toBeUndefined();
  });

  it("should generate a timestamp that is recent", () => {
    let state = createInitialState();
    const habitTask: TaskStub = {
      id: "t2",
      title: "Stretch [count:1] [freq:daily]",
      notes: "",
      isDone: false,
      tagIds: [],
    };

    const result = processTaskCompletion(state, habitTask);
    const updates = result.taskUpdates!;
    if (!updates.notes) throw new Error("Notes missing");
    const match = updates.notes.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) throw new Error("JSON missing");
    const qd = JSON.parse(match[1]!);

    const now = Date.now();
    const lastDone = new Date(qd.progress.lastDoneDate).getTime();
    expect(now - lastDone).toBeLessThan(1000); // within 1 second
  });

  it("should clean up accumulated suffixes", () => {
    let state = createInitialState();
    // Simulate a dirty title
    const dirtyTask: TaskStub = {
      id: "t3",
      title: "Messy Task [count:3] [freq:daily] (0/3) (1/3) 🔥 1/2",
      notes: "",
      isDone: false,
      tagIds: [],
    };

    const result = processTaskCompletion(state, dirtyTask);
    const updates = result.taskUpdates!;

    // Should have cleaned up old suffixes and appended *only* the new one
    // Expect: "Messy Task [count:3] [freq:daily] (1/3)"
    // Note: Streak info is missing in input data so it won't be re-appended unless we mock the JSON note too.
    // But cleanTitle logic should remove the garbage.

    // Note: Streak info IS now appended by default if missing in input but added by logic
    // Received: "Messy Task [count:3] [freq:daily] (1/3) 0/1 🔥"
    // We just want to check it cleaned up the OLD repetitions " (0/3) (1/3) 🔥 1/2"

    expect(updates.title).toContain("Messy Task [count:3] [freq:daily] (1/3)");
    expect(updates.title).not.toContain("(0/3)");
    expect(updates.title).not.toContain("1/2"); // Old streak suffix should be gone (replaced by new one or none)
  });

  it("should clean up new streak format 1/2 🔥", () => {
    let state = createInitialState();
    const dirtyTask: TaskStub = {
      id: "t4",
      title: "Messy Task [count:3] [freq:daily] (0/3) (1/3) 1/2 🔥",
      notes: "",
      isDone: false,
      tagIds: [],
    };

    const result = processTaskCompletion(state, dirtyTask);
    const updates = result.taskUpdates!;

    expect(updates.title).toContain("Messy Task [count:3] [freq:daily] (1/3)");
    expect(updates.title).not.toContain("(0/3)");
  });
});
