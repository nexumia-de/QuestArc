// import { Project } from '../types/plugin-api';

export interface QuestProject {
    id: string;
    title: string;
    originalTitle: string; // The title without status icons
    icon?: string;
    type: 'TEMPLATE' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'UNKNOWN';
}

export interface QuestEnvironment {
    active: QuestProject | null;
    templates: QuestProject[];
    paused: QuestProject[];
    warnings: string[];
}

// We assume PluginAPI is available globally as declared in types/plugin-api.ts

export class ProjectScannerService {
    /**
     * Main entry point. Fetches all projects from SP and categorizes them.
     */
    static async scan(): Promise<QuestEnvironment> {
        // In a real scenario, we might want to dependency inject PluginAPI for easier testing,
        // but sticking to the global pattern used elsewhere for now.
        const allProjects = await PluginAPI.getAllProjects();

        const env: QuestEnvironment = {
            active: null,
            templates: [],
            paused: [],
            warnings: []
        };

        for (const p of allProjects) {
            // 2. Classify based on Title
            const classification = this.classifyProject(p.title);

            // 1. Filter: Must have the Bow Icon OR match a known Quest pattern
            // Risks: Icon Fragility - we allow detection if title matches even if icon is wrong.
            // But we should probably strictly enforce at least one indicator.
            const hasIcon = p.icon === '🏹';
            const isQuestPattern = classification !== 'UNKNOWN';

            if (!hasIcon && !isQuestPattern) continue;

            const questProj: QuestProject = {
                id: p.id,
                title: p.title,
                originalTitle: this.cleanTitle(p.title, classification),
                icon: p.icon,
                type: classification
            };

            if (!hasIcon && isQuestPattern) {
                env.warnings.push(`"${p.title}": Missing 🏹 icon.`);
            }

            if (hasIcon && !isQuestPattern) {
                // It has the icon but no known suffix. It's likely a generic "Quest" or user error.
                // We can ignore it or list it as UNKNOWN (which is ignored by UI).
                continue;
            }

            switch (classification) {
                case 'ACTIVE':
                    // Critical: Enforce Single Source of Truth
                    if (env.active) {
                        const msg = `Multi-active: ${env.active.title} & ${p.title}. Using ${env.active.title}.`;
                        // console.warn(msg);
                        env.warnings.push(msg);
                    } else {
                        env.active = questProj;
                    }
                    break;

                case 'PAUSED':
                    env.paused.push(questProj);
                    break;
                case 'TEMPLATE':
                    env.templates.push(questProj);
                    break;
                case 'UNKNOWN':
                    // Just ignore unknown types even if they have the icon?
                    // Maybe log it?
                    break;
            }
        }

        return env;
    }

    private static classifyProject(title: string): QuestProject['type'] {
        if (title.endsWith('🧭')) return 'ACTIVE';
        if (title.startsWith('📜')) return 'TEMPLATE';
        if (title.endsWith('⏸️')) return 'PAUSED';
        return 'UNKNOWN';
    }

    private static cleanTitle(title: string, type: QuestProject['type']): string {
        // Strips emojis based on type to get the "Core Name"
        if (type === 'TEMPLATE') return title.replace(/^📜\s*/, '');
        if (type === 'ACTIVE') return title.replace(/\s*🧭$/, '');
        if (type === 'PAUSED') return title.replace(/\s*⏸️$/, '');
        return title;
    }
}
