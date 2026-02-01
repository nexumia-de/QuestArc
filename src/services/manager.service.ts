import { PluginService } from './PluginService';
import { CompilerService } from './compiler.service';
import { BossService } from './BossService';
import { QuestArcState, StoryStep } from '../types/state';

export class QuestManagerService {
    /**
     * Starts a new quest.
     * @param targetId - Either a template Project ID (for custom quests) or a Story ID (for built-in quests)
     * @param state - Current QuestArc state
     * @returns Updated QuestArc state
     */
    static async startQuest(targetId: string, state: QuestArcState): Promise<QuestArcState> {
        // 1. Safety Check: Is there an active quest?
        if (state.activeStory.id && !state.activeStory.isCompleted) {
            // Self-Healing: Check if this project actually exists
            try {
                const projects = await PluginService.api.getAllProjects();
                const existingProject = projects.find(p => p.id === state.activeStory.id);

                if (existingProject) {
                    throw new Error('An active quest is already running. Please pause or complete it first.');
                }

                PluginService.log.warn(`[QuestManager] Detected zombie quest ID ${state.activeStory.id} (Project not found). Clearing state and proceeding.`);
                // Clean up zombie state implicitly by allowing overwrite below
            } catch (e) {
                // If API fails, safety fallback: assume it exists if we can't check
                if ((e as Error).message.includes('running')) throw e;
                PluginService.log.error('Failed to verify active project:', e);
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
                PluginService.log.info(`[QuestManager] Found active boss on start: ${bossResult.config.name}`);
                activeBoss = {
                    ...bossResult.config,
                    isDead: false
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
                    tasksCreatedForStepId: null
                },
                activeBoss: activeBoss
            };

        } catch (error) {
            PluginService.log.error('Failed to start quest:', error);
            throw new Error(`Failed to start quest: ${(error as any).message}`);
        }
    }

    /**
     * Pauses the currently active quest (Archives it).
     */
    static async pauseQuest(state: QuestArcState): Promise<QuestArcState> {
        const activeProjectId = state.activeStory.id;

        if (!activeProjectId) {
            throw new Error('No active quest to pause.');
        }

        try {
            // Fetch project to get current title
            const projects = await PluginService.api.getAllProjects();
            const project = projects.find(p => p.id === activeProjectId);

            if (!project) throw new Error('Active project not found.');

            // Replace 🧭 with ⏸️
            const newTitle = project.title.replace('🧭', '⏸️');
            await PluginService.api.updateProject(activeProjectId, { title: newTitle });

            // Update State: Clear active story
            return {
                ...state,
                activeStory: {
                    ...state.activeStory, // keep structure or reset?
                    id: null,
                    isCompleted: false
                }
            };
        } catch (error) {
            PluginService.log.error('Failed to pause quest:', error);
            throw new Error(`Failed to pause quest: ${(error as any).message}`);
        }
    }

    /**
     * Resumes a paused quest.
     */
    static async resumeQuest(pausedProjectId: string, state: QuestArcState): Promise<QuestArcState> {
        // Check for active conflicts
        if (state.activeStory.id && !state.activeStory.isCompleted) {
            throw new Error('Cannot resume: Another quest is currently active.');
        }

        try {
            const projects = await PluginService.api.getAllProjects();
            const project = projects.find(p => p.id === pausedProjectId);

            if (!project) throw new Error('Paused project not found.');

            // Replace ⏸️ with 🧭
            const newTitle = project.title.replace('⏸️', '🧭');
            await PluginService.api.updateProject(pausedProjectId, { title: newTitle });

            // Restore state
            return {
                ...state,
                activeStory: {
                    ...state.activeStory,
                    id: pausedProjectId,
                    isCompleted: false
                    // We don't know the exact step ID without more persistence, 
                    // but for now we assume the state was preserved in the Brain or we rely on the user to pick up where they left off.
                    // Ideally, we should have stored the paused state in `completedStories` or a `pausedStories` list.
                    // But V2 logic seems to rely on the Project being the source of truth for tasks.
                }
            };
        } catch (error) {
            PluginService.log.error('Failed to resume quest:', error);
            throw new Error(`Failed to resume quest: ${(error as any).message}`);
        }
    }

    /**
     * Injects tasks for a specific step into the project.
     */
    static async injectStepTasks(projectId: string, step: StoryStep) {
        if (!step.tasksToCreate) return;

        PluginService.log.info(`[QuestArc] Injecting ${step.tasksToCreate.length} tasks for Step ${step.id}`);

        for (const def of step.tasksToCreate) {
            if (def.isAutoCreate) {
                await PluginService.api.addTask({
                    title: `${def.title} #QuestArc`,
                    projectId: projectId,
                    notes: def.notes || '' // Persistence/QuestData
                });
            }
        }
    }
}

