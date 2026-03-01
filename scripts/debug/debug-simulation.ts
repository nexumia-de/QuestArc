import { HabitService } from "./src/services/HabitService";
import { PluginService } from "./src/services/PluginService";

// Mock PluginService
Object.defineProperty(PluginService, "api", {
  value: {
    getAllProjects: async () => [
      { title: "QuestArc Grimoire", id: "GRIMOIRE_ID" },
    ],
    getTasks: async () => [],
    addTask: async (t) => t.title, // Return title as ID
    updateTask: async (id, changes) => {
      console.log("\n--- SIMULATION UPDATE ---");
      console.log(`Task ID: ${id}`);
      console.log(`New Title: "${changes.title}"`);
      console.log(`IsDone: ${changes.isDone}`);
      console.log(`Notes (Frequency in JSON):`);
      const jsonMatch = changes.notes?.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        console.log(`  Frequency: "${data.routine?.frequency}"`);
      }
    },
  },
  writable: true,
});

PluginService.log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
} as any;

PluginService.showSnack = (msg) => console.log(`[SNACK] ${msg}`);

async function run() {
  const mockTask = {
    id: "TASK_123",
    title: "Multi [freq: 0 0 * * 1-5]",
    projectId: "PROJECT_1",
    notes:
      '```json\n{ "routine": { "frequency": "daily" }, "progress": { "current": 1, "target": 1 } }\n```', // Stale JSON
    tagIds: [],
  };

  console.log("--- STARTING SIMULATION ---");
  console.log(`Input Task: "${mockTask.title}"`);
  console.log(`Input JSON Freq: "daily" (Simulating stale data)`);

  await HabitService.persistHabit(mockTask as any, "Story 1");
}

run().catch(console.error);
