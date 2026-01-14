// import { Project } from '../types/plugin-api';
import { ProjectScannerService, QuestEnvironment } from './scanner.service';
import { CompilerService } from './compiler.service';

export class QuestManagerService {
    /**
     * Starts a new quest from a template.
     * Compiles the template and returns the updated environment.
     */
    static async startQuest(templateId: string): Promise<QuestEnvironment> {
        // 1. Safety Check: Is there an active quest?
        const currentEnv = await ProjectScannerService.scan();
        if (currentEnv.active) {
            throw new Error('An active quest is already running. Please pause or complete it first.');
        }

        // 2. Compile (Create new project)
        try {
            await CompilerService.compileQuest(templateId);
        } catch (error) {
            console.error('Failed to compile quest:', error);
            throw new Error(`Failed to start quest: ${(error as any).message}`);
        }

        // 3. Return updated environment (Reactive update)
        return await ProjectScannerService.scan();
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
