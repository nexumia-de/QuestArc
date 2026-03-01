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

    // 3rd Completion (Over-completion / Soft Allow check)
    // Default mode is 'soft': extra completions pass silently (isBonusCompletion) without a block dialog.

    const habitTask3: TaskStub = {
      ...habitTask2,
      title: updates2.title!,
      notes: updates2.notes,
      isDone: true, // It is already done
    };

    // In soft mode (default), extra completion on the SAME day should NOT block,
    // but it should also NOT increment the visual bonus counter (silent pass-through).
    const result3 = processTaskCompletion(state, habitTask3);

    expect(result3.shouldBlock).toBeFalsy();
    expect(result3.isBonusCompletion).toBe(true);
    expect(result3.xpGained).toBe(0);
    expect(result3.damageDealt).toBe(0);
    // Silent pass-through only returns isDone: true
    expect(result3.taskUpdates?.title).toBeUndefined();
    expect(result3.taskUpdates?.isDone).toBe(true);
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

describe("Scheduling: Soft Allow & Daily Floor", () => {
  // Helper: build a QuestTaskData-backed task that was already completed today
  function makeCompletedHabitTask(
    freq: string,
    extra: { shouldBlock?: boolean; minReset?: string } = {},
  ): TaskStub {
    const lastDoneDate = new Date().toISOString(); // today
    const tags = [
      `[freq:${freq}]`,
      extra.shouldBlock ? "[shouldBlock:true]" : "",
      extra.minReset ? `[minReset:${extra.minReset}]` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const questData = {
      meta: { type: "HABIT", version: 1, originalTitle: "Test Habit", frequency: freq },
      progress: {
        current: 1,
        target: 1,
        lastDoneDate,
        streak: { current: 1, highest: 1, tier: "bronze", totalCompletions: 1, availableGrace: 1 },
      },
    };

    return {
      id: "sched-test",
      title: `Test Habit ${tags}`,
      notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``,
      isDone: true,
      tagIds: [],
    };
  }

  it("soft mode (default): extra daily completion returns isBonusCompletion, no block", () => {
    const state = createInitialState();
    const task = makeCompletedHabitTask("daily");
    const result = processTaskCompletion(state, task);

    expect(result.shouldBlock).toBeFalsy();
    expect(result.isBonusCompletion).toBe(true);
    expect(result.xpGained).toBe(0);
    expect(result.damageDealt).toBe(0);
  });

  it("soft mode (default): extra weekly completion same day returns isBonusCompletion", () => {
    const state = createInitialState();
    const task = makeCompletedHabitTask("weekly");
    const result = processTaskCompletion(state, task);

    expect(result.shouldBlock).toBeFalsy();
    expect(result.isBonusCompletion).toBe(true);
  });

  it("strict via [shouldBlock:true] tag: extra completion triggers hard block", () => {
    const state = createInitialState();
    const task = makeCompletedHabitTask("daily", { shouldBlock: true });
    const result = processTaskCompletion(state, task);

    expect(result.shouldBlock).toBe(true);
    expect(result.blockReason).toBe("ALREADY_DONE_TODAY");
    expect(result.isBonusCompletion).toBeFalsy();
  });

  it("strict via global habitCompletionMode setting: extra completion triggers hard block", () => {
    const state = {
      ...createInitialState(),
      settings: {
        ...createInitialState().settings,
        habitCompletionMode: "strict" as const,
        completionMinGranularity: "daily" as const,
        customTags: [],
      },
    };
    const task = makeCompletedHabitTask("daily");
    const result = processTaskCompletion(state, task);

    expect(result.shouldBlock).toBe(true);
    expect(result.blockReason).toBe("ALREADY_DONE_TODAY");
  });

  it("daily floor: sub-daily freq (hourly) still blocked on same calendar day by default", () => {
    // 0 * * * * = every hour on the hour
    const state = createInitialState();
    const task = makeCompletedHabitTask("0 * * * *");
    const result = processTaskCompletion(state, task);

    // Daily floor applies: even though cycle resets every hour,
    // same calendar day means bonus completion only
    expect(result.shouldBlock).toBeFalsy();
    expect(result.isBonusCompletion).toBe(true);
    expect(result.xpGained).toBe(0);
  });

  it("[minReset:cycle] override: sub-daily freq can earn again in next cycle even same day", () => {
    // With minReset:cycle, the daily-floor is bypassed.
    // We simulate this by traveling back one cycle (lastDoneDate more than 1hr ago)
    // so that cyclesPassed > 0 and normal completion is allowed.
    // This test just verifies that the tag parses and doesn't force a block.
    const freq = "0 * * * *"; // hourly
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const questData = {
      meta: { type: "HABIT", version: 1, originalTitle: "Hourly Check", frequency: freq },
      progress: {
        current: 0,
        target: 1,
        lastDoneDate: twoHoursAgo,
        streak: { current: 1, highest: 1, tier: "bronze", totalCompletions: 1, availableGrace: 1 },
      },
    };
    const task: TaskStub = {
      id: "cycle-test",
      title: `Hourly Check [freq:${freq}] [minReset:cycle]`,
      notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``,
      isDone: false,
      tagIds: [],
    };

    const state = createInitialState();
    const result = processTaskCompletion(state, task);

    // 2 hours passed = cyclesPassed > 0, so this is a real new completion
    expect(result.shouldBlock).toBeFalsy();
    expect(result.isBonusCompletion).toBeFalsy();
    expect(result.taskUpdates?.isDone).toBe(true);
  });

  it("visual bonus (+1🔥) is awarded for same-cycle completion on a DIFFERENT calendar day", () => {
    // e.g. weekly habit checked on Monday, then checked again on Wednesday (same cycle, diff day)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const questData = {
      meta: { type: "HABIT", version: 1, originalTitle: "Weekly Yoga", frequency: "weekly" },
      progress: {
        current: 1,
        target: 1,
        lastDoneDate: yesterday, // done yesterday
        streak: { current: 1, highest: 1, tier: "bronze", totalCompletions: 1, availableGrace: 1 },
      },
    };
    const task: TaskStub = {
      id: "visual-bonus-test",
      title: `Weekly Yoga [freq:weekly]`,
      notes: `\`\`\`json\n${JSON.stringify(questData, null, 2)}\n\`\`\``,
      isDone: true,
      tagIds: [],
    };

    const state = createInitialState();
    const result = processTaskCompletion(state, task);

    expect(result.shouldBlock).toBeFalsy();
    expect(result.isBonusCompletion).toBe(true);
    expect(result.xpGained).toBe(0);
    // Title SHOULD contain the visual bonus because it's a different day
    expect(result.taskUpdates?.title).toContain("+1🔥");
    expect(result.taskUpdates?.isDone).toBe(false); // stays open so user can check again tomorrow
  });
});
