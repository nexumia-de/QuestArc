// import { Project } from '../types/plugin-api';
import { ProjectScannerService, QuestEnvironment } from './scanner.service';
import { CompilerService } from './compiler.service';
import { Persistence } from '../lib/persistence';
import { HeroStory, StoryStep } from '../types/state';

export class QuestManagerService {
    /**
     * Starts a new quest.
     * @param targetId - Either a template Project ID (for custom quests) or a Story ID (for built-in quests)
     * @param isSystemQuest - If true, loads from built-in stories.
     */
    static async startQuest(targetId: string): Promise<QuestEnvironment> {
        // 1. Safety Check: Is there an active quest?
        const currentEnv = await ProjectScannerService.scan();
        if (currentEnv.active) {
            throw new Error('An active quest is already running. Please pause or complete it first.');
        }

        let newProjectId: string;
        let storyDef: HeroStory | undefined;

        // 2. Create Project & Initialize State
        try {
            // Just compile. No system quests.
            newProjectId = await CompilerService.compileQuest(targetId);

            // Init State for new quest
            const state = Persistence.loadState();
            const storyDef = {
                id: targetId,
                title: 'Custom Quest',
                steps: [], // Custom quests don't have rigid steps yet
                boss: undefined
            };

            state.activeStory = {
                id: targetId,
                currentStepId: 1,
                taskProgress: {}
            };
            // We might need to ensure a "Custom Story" placeholder exists in state if we want Bosses to work?
            // For now, let's just save the active state so the UI knows something is running.
            Persistence.saveState(state);

        } catch (error) {
            console.error('Failed to start quest:', error);
            throw new Error(`Failed to start quest: ${(error as any).message}`);
        }

        // 3. Return updated environment (Reactive update)
        return await ProjectScannerService.scan();
    }

    /**
     * Injects tasks for a specific step into the project.
     */
    static async injectStepTasks(projectId: string, step: StoryStep) {
        if (!step.tasksToCreate) return;

        console.log(`[QuestArc] Injecting ${step.tasksToCreate.length} tasks for Step ${step.id}`);

        for (const def of step.tasksToCreate) {
            if (def.isAutoCreate) {
                await PluginAPI.addTask({
                    title: def.title,
                    projectId: projectId,
                    notes: def.notes || '' // Persistence/QuestData
                });
            }
        }

        // Mark that we created tasks (in state)? 
        // Ideally state-manager tracks this to avoid double-creation on reload.
        // For now, fire-and-forget.
    }

    /**
     * Pauses the currently active quest (Archives it).
     */
    static async pauseQuest(activeProjectId: string): Promise<QuestEnvironment> {
        try {
            // Fetch project to get current title
            // Since PluginAPI.getProject(id) isn't in our type def yet, we'll use getAllProjects
            const projects = await PluginAPI.getAllProjects();
            const project = projects.find(p => p.id === activeProjectId);

            if (!project) throw new Error('Active project not found.');

            // Replace 🧭 with ⏸️
            const newTitle = project.title.replace('🧭', '⏸️');
            await PluginAPI.updateProject(activeProjectId, { title: newTitle });

            return await ProjectScannerService.scan();
        } catch (error) {
            console.error('Failed to pause quest:', error);
            throw new Error(`Failed to pause quest: ${(error as any).message}`);
        }
    }

    /**
     * Resumes a paused quest.
     */
    static async resumeQuest(pausedProjectId: string): Promise<QuestEnvironment> {
        // Check for active conflicts
        const currentEnv = await ProjectScannerService.scan();
        if (currentEnv.active) {
            throw new Error('Cannot resume: Another quest is currently active.');
        }

        try {
            const projects = await PluginAPI.getAllProjects();
            const project = projects.find(p => p.id === pausedProjectId);

            if (!project) throw new Error('Paused project not found.');

            // Replace ⏸️ with 🧭
            const newTitle = project.title.replace('⏸️', '🧭');
            await PluginAPI.updateProject(pausedProjectId, { title: newTitle });

            return await ProjectScannerService.scan();
        } catch (error) {
            console.error('Failed to resume quest:', error);
            throw new Error(`Failed to resume quest: ${(error as any).message}`);
        }
    }
}
