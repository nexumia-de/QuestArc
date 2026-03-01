import { QuestArcState } from "../types/state";
import { PluginService } from "../services/PluginService";
import { BossService } from "../services/BossService";
import { Task } from "../types/plugin-api";

export class ContextHandler {
  static async handle(
    taskId: string | null,
    state: QuestArcState,
    saveCallback: (newState: QuestArcState) => Promise<void>,
  ) {
    if (!taskId) return;

    try {
      const tasks = await PluginService.api.getTasks();
      const currentTask = tasks.find((t) => t.id === taskId);

      if (!currentTask) return;

      // 1. Check Self (Is the current task a Boss?)
      let bossMs = BossService.extractBossConfig(currentTask);

      if (!bossMs) {
        // 2. Check Siblings
        const result = await BossService.scanForSiblingBoss(
          currentTask as unknown as Task,
          tasks as unknown as Task[],
        );
        if (result) bossMs = result.config;
      }

      if (bossMs) {
        // Check if we need to switch active boss
        // Logic: If activeBoss is null OR name is different, switch.
        // If name is same, we keep existing (preserves HP damage).
        if (!state.activeBoss || state.activeBoss.name !== bossMs.name) {
          PluginService.log.info(
            `[ContextHandler] Context switched to Boss: ${bossMs.name}`,
          );

          const newState = {
            ...state,
            activeBoss: {
              ...bossMs,
              isDead: false,
            },
          };
          await saveCallback(newState);
        }
      } else {
        // No boss found in this context.
        // If we have an active boss, we should probably clear it to avoid "ghost" bosses from other projects.
        // BUT, if we have an active MAIN QUEST (Story), we want to keep that boss visible globally.
        if (state.activeBoss) {
          const isGlobalQuestActive =
            state.activeStory &&
            state.activeStory.id &&
            !state.activeStory.isCompleted;

          PluginService.log.info(
            `[ContextHandler] Checking Clear Condition. Active Story: ${state.activeStory?.id}, Completed: ${state.activeStory?.isCompleted}, Keep: ${isGlobalQuestActive}`,
          );

          if (!isGlobalQuestActive) {
            PluginService.log.info(
              `[ContextHandler] Context switched away from Boss. Clearing.`,
            );
            const newState = {
              ...state,
              activeBoss: null,
            };
            await saveCallback(newState);
          }
        }
      }
    } catch (e) {
      PluginService.log.error("ContextHandler: Error", e);
    }
  }
}
