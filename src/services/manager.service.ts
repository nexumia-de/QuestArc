import { PluginService } from "./PluginService";
import { CompilerService } from "./compiler.service";
import { BossService } from "./BossService";
import { QuestArcState, StoryStep } from "../types/state";

export class QuestManagerService {
  /**
   * Starts a new quest.
   * @param targetId - Either a template Project ID (for custom quests) or a Story ID (for built-in quests)
   * @param state - Current QuestArc state
   * @returns Updated QuestArc state
   */
  static async startQuest(
    targetId: string,
    state: QuestArcState,
  ): Promise<QuestArcState> {
    // 1. Safety Check: Is there an active quest?
    if (state.activeStory.id && !state.activeStory.isCompleted) {
      // Self-Healing: Check if this project actually exists
      try {
        const projects = await PluginService.api.getAllProjects();
        const existingProject = projects.find(
          (p) => p.id === state.activeStory.id,
        );

        if (existingProject) {
          throw new Error(
            "An active quest is already running. Please pause or complete it first.",
          );
        }

        PluginService.log.warn(
          `[QuestManager] Detected zombie quest ID ${state.activeStory.id} (Project not found). Clearing state and proceeding.`,
        );
        // Clean up zombie state implicitly by allowing overwrite below
      } catch (e) {
        // If API fails, safety fallback: assume it exists if we can't check
        if ((e as Error).message.includes("running")) throw e;
        PluginService.log.error("Failed to verify active project:", e);
        // Fallthrough? No, safer to block if API is down, but here we assume API works.
        // If the check strictly failed, we might want to throw to be safe, OR check if error was the "already running" one.
      }
    }

    let newProjectId: string;

    // 2. Create Project & Initialize State
    try {
      // Just compile. No system quests.
      newProjectId = await CompilerService.compileQuest(targetId);

      // 3. Boss Detection (Immediate)
      // Fix: Boss should appear immediately, not just after damage.
      let activeBoss = null;
      const bossResult = await BossService.scanProjectForBoss(newProjectId);
      if (bossResult) {
        PluginService.log.info(
          `[QuestManager] Found active boss on start: ${bossResult.config.name}`,
        );
        activeBoss = {
          ...bossResult.config,
          isDead: false,
        };
      }

      // Return new state with active story
      return {
        ...state,
        activeStory: {
          id: newProjectId,
          sourceTemplateId: targetId,
          currentStepId: 1,
          taskProgress: {},
          isCompleted: false,
          tasksCreatedForStepId: null,
        },
        activeBoss: activeBoss,
      };
    } catch (error) {
      PluginService.log.error("Failed to start quest:", error);
      throw new Error(`Failed to start quest: ${(error as any).message}`);
    }
  }

  /**
   * Pauses the currently active quest (Archives it).
   */
  static async pauseQuest(state: QuestArcState): Promise<QuestArcState> {
    const activeProjectId = state.activeStory.id;

    if (!activeProjectId) {
      throw new Error("No active quest to pause.");
    }

    try {
      // Fetch project to get current title
      const projects = await PluginService.api.getAllProjects();
      const project = projects.find((p) => p.id === activeProjectId);

      if (!project) throw new Error("Active project not found.");

      // Replace 🧭 with ⏸️
      const newTitle = project.title.replace("🧭", "⏸️");
      await PluginService.api.updateProject(activeProjectId, {
        title: newTitle,
      });

      // Update State: Clear active story
      return {
        ...state,
        activeStory: {
          ...state.activeStory, // keep structure or reset?
          id: null,
          isCompleted: false,
        },
      };
    } catch (error) {
      PluginService.log.error("Failed to pause quest:", error);
      throw new Error(`Failed to pause quest: ${(error as any).message}`);
    }
  }

  /**
   * Resumes a paused quest.
   */
  static async resumeQuest(
    pausedProjectId: string,
    state: QuestArcState,
  ): Promise<QuestArcState> {
    // Check for active conflicts
    if (state.activeStory.id && !state.activeStory.isCompleted) {
      throw new Error("Cannot resume: Another quest is currently active.");
    }

    try {
      const projects = await PluginService.api.getAllProjects();
      const project = projects.find((p) => p.id === pausedProjectId);

      if (!project) throw new Error("Paused project not found.");

      // Replace ⏸️ with 🧭
      const newTitle = project.title.replace("⏸️", "🧭");
      await PluginService.api.updateProject(pausedProjectId, {
        title: newTitle,
      });

      // Restore state
      return {
        ...state,
        activeStory: {
          ...state.activeStory,
          id: pausedProjectId,
          isCompleted: false,
          // We don't know the exact step ID without more persistence,
          // but for now we assume the state was preserved in the Brain or we rely on the user to pick up where they left off.
          // Ideally, we should have stored the paused state in `completedStories` or a `pausedStories` list.
          // But V2 logic seems to rely on the Project being the source of truth for tasks.
        },
      };
    } catch (error) {
      PluginService.log.error("Failed to resume quest:", error);
      throw new Error(`Failed to resume quest: ${(error as any).message}`);
    }
  }

  /**
   * Injects tasks for a specific step into the project.
   */
  static async injectStepTasks(projectId: string, step: StoryStep) {
    if (!step.tasksToCreate) return;

    PluginService.log.info(
      `[QuestArc] Injecting ${step.tasksToCreate.length} tasks for Step ${step.id}`,
    );

    for (const def of step.tasksToCreate) {
      if (def.isAutoCreate) {
        await PluginService.api.addTask({
          title: `${def.title} #QuestArc`,
          projectId: projectId,
          notes: def.notes || "", // Persistence/QuestData
        });
      }
    }
  }

  /**
   * Exports a project as a JSON string template.
   */
  static async exportTemplate(projectId: string): Promise<string> {
    try {
      const projects = await PluginService.api.getAllProjects();
      const project = projects.find((p) => p.id === projectId);
      if (!project) throw new Error(`Project ${projectId} not found`);

      const allTasks = await PluginService.api.getTasks();
      const tasks = allTasks.filter((t: any) => t.projectId === projectId);

      const exportData = {
        project: {
          title: project.title,
          icon: project.icon,
        },
        tasks: tasks.map((t: any) => ({
          title: t.title,
          notes: t.notes,
          isDone: t.isDone,
          tagIds: t.tagIds, // We probably can't easily map tags across systems, but we keep them for reference?
          // Flat structure for now, parent/child handled by ID remapping during import?
          // Actually, for export, we should probably nest them or simpler: preserve parentId relationship IF we keep original IDs...
          // But on import we generate new IDs. So we need a relative ID system or just rely on 'parentId' property referencing an unknown ID that we need to map.
          // Let's stick to including 'parentId' and 'id' so we can rebuild the tree.
          id: t.id,
          parentId: t.parentId,
        })),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      PluginService.log.error("Failed to export template:", error);
      throw new Error(`Failed to export template: ${(error as any).message}`);
    }
  }

  /**
   * Imports a project from a JSON string template.
   */
  static async importTemplate(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);

      if (!data.project || !data.tasks) {
        throw new Error("Invalid template format: Missing project or tasks");
      }

      // 1. Create Project
      const newProjectId = await PluginService.api.addProject({
        title: data.project.title,
        icon: data.project.icon,
      });

      // 2. Create Tasks & Map IDs
      const idMap = new Map<string, string>(); // Old ID -> New ID
      const tasks = data.tasks;

      // Separate tasks into Roots (no parent) and Children (has parent)
      const rootTasks = tasks.filter((t: any) => !t.parentId);
      let childTasks = tasks.filter((t: any) => t.parentId);

      // 2a. Create Roots
      for (const t of rootTasks) {
        const newId = await PluginService.api.addTask({
          title: t.title,
          projectId: newProjectId,
          notes: t.notes,
          tagIds: t.tagIds, // Try to preserve tags if valid
        });
        idMap.set(t.id, newId);
      }

      // 2b. Create Children (Iterative loop to handle multi-level hierarchy order)
      let progress = true;
      // Limit iterations to prevent infinite loops on circular dependencies (though rare in SP)
      // Worst case depth is total number of tasks
      while (childTasks.length > 0 && progress) {
        progress = false;
        const nextPass: any[] = [];

        for (const t of childTasks) {
          const newParentId = idMap.get(t.parentId);

          if (newParentId) {
            // Parent exists! Create child linked to it.
            const newId = await PluginService.api.addTask({
              title: t.title,
              projectId: newProjectId,
              notes: t.notes,
              parentId: newParentId,
              tagIds: t.tagIds,
            });
            idMap.set(t.id, newId);
            progress = true;
          } else {
            // Parent not yet created (or missing)
            nextPass.push(t);
          }
        }
        childTasks = nextPass;
      }

      // 2c. Handle Orphans (If any tasks remaining whose parents were never found)
      if (childTasks.length > 0) {
        PluginService.log.warn(
          `[QuestManager] ${childTasks.length} tasks orphaned during import (parent missing). Creating as roots.`,
        );
        for (const t of childTasks) {
          const newId = await PluginService.api.addTask({
            title: t.title,
            projectId: newProjectId,
            notes: t.notes,
            tagIds: t.tagIds,
          });
          idMap.set(t.id, newId);
        }
      }

      PluginService.log.info(
        `[QuestManager] Imported template "${data.project.title}" with ${tasks.length} tasks.`,
      );
    } catch (error) {
      PluginService.log.error("Failed to import template:", error);
      throw new Error(`Failed to import template: ${(error as any).message}`);
    }
  }
}
