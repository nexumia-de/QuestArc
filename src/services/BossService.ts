import { BossConfig } from '../types/state';
import { Task } from '../types/plugin-api';
import { PluginService } from './PluginService';

export interface BossResult {
    config: BossConfig;
    taskId: string;
}

export class BossService {
    // Relaxed Regex 1: [ HP : 100 ]
    private static readonly BOSS_REGEX_BRACKET = /(?:(?:⚔️|🛡️)\s*)?(.+?)\s*\[\s*HP\s*:\s*(\d+)\s*\]/iu;
    // Relaxed Regex 2: Name 100/100 (Common RPG format), allows optional heart
    private static readonly BOSS_REGEX_FRACTION = /(?:(?:⚔️|🛡️)\s*)?(.+?)\s+(\d+)\s*\/\s*(\d+)/iu;

    /**
     * Extracts Boss Configuration from a task.
     * Priority: JSON notes > Title parsing
     */
    static extractBossConfig(task: Task | { title: string; notes?: string }): BossConfig | null {
        // 1. Try to read from JSON notes (source of truth)
        if ('notes' in task && task.notes) {
            try {
                const match = task.notes.match(/```json\s*([\s\S]*?)\s*```/);
                if (match && match[1]) {
                    const data = JSON.parse(match[1]);
                    if (data.meta?.type === 'BOSS' && data.progress) {
                        return {
                            name: data.meta.originalTitle?.replace(/\[.*?\]/g, '').trim() || 'Boss',
                            hp: data.progress.current,
                            maxHp: data.progress.target,
                            isDead: data.progress.current <= 0,
                            themeColor: '#ff0000'
                        };
                    }
                }
            } catch (e) { /* ignore parse errors */ }
        }

        // 2. Fallback to title parsing
        // Try Bracket Match
        let match = task.title.match(this.BOSS_REGEX_BRACKET);
        if (match && match[1] && match[2]) {
            const name = match[1].trim();
            const hp = parseInt(match[2], 10);
            return { name, hp, maxHp: hp, isDead: false, themeColor: '#ff0000' };
        }

        // Try Fraction Match
        match = task.title.match(this.BOSS_REGEX_FRACTION);
        if (match && match[1] && match[2] && match[3]) {
            const name = match[1].trim();
            const hp = parseInt(match[2], 10);
            const maxHp = parseInt(match[3], 10);
            return { name, hp, maxHp, isDead: hp <= 0, themeColor: '#ff0000' };
        }

        return null;
    }

    /**
     * Scans for a sibling task that matches the Boss pattern.
     * Returns both the config AND the boss task ID for updates.
     */
    static async scanForSiblingBoss(task: Task, allTasks?: Task[]): Promise<BossResult | null> {
        try {
            if (!allTasks) {
                allTasks = await PluginService.api.getTasks() as unknown as Task[];
            }

            let siblings: Task[] = [];

            if (task.parentId) {
                siblings = allTasks.filter(t => t.parentId === task.parentId && t.id !== task.id);
            } else if (task.projectId) {
                // Root tasks in same project
                siblings = allTasks.filter(t => t.projectId === task.projectId && !t.parentId && t.id !== task.id);
            } else {
                // Inbox Root Tasks (No Project, No Parent)
                siblings = allTasks.filter(t => !t.projectId && !t.parentId && t.id !== task.id);
            }

            PluginService.log.info(`[BossService] Scanning ${siblings.length} siblings for boss pattern relative to "${task.title}"`);

            // Find first sibling that matches Boss pattern and is NOT done
            const bossSibling = siblings.find(t => {
                const config = this.extractBossConfig(t);
                const isMatch = !!config;

                PluginService.log.info(`[BossService] Checking sibling: "${t.title}" (ID: ${t.id}, Done: ${t.isDone}) -> Match: ${isMatch}`);

                if (t.isDone) return false;
                return isMatch;
            });

            if (bossSibling) {
                const config = this.extractBossConfig(bossSibling);
                if (config) {
                    return { config, taskId: bossSibling.id };
                }
            }
        } catch (e) {
            PluginService.log.error('BossService: Error scanning for sibling boss', e);
        }
        return null;
    }

    /**
     * Updates a boss task's JSON notes with new HP.
     */
    static async updateBossHp(bossTaskId: string, newHp: number, maxHp: number, originalTitle: string): Promise<void> {
        const newTitle = `${originalTitle.replace(/\[.*?\]/g, '').trim()} ${newHp}/${maxHp} ❤️`;
        const jsonData = {
            meta: {
                type: 'BOSS',
                version: 1,
                originalTitle
            },
            progress: {
                current: newHp,
                target: maxHp,
                unit: 'HP'
            },
            boss: {
                hp: newHp
            }
        };

        const notes = `\`\`\`json\n${JSON.stringify(jsonData, null, 2)}\n\`\`\``;

        await PluginService.api.updateTask(bossTaskId, {
            title: newTitle,
            notes,
            isDone: newHp <= 0
        });

        PluginService.log.info(`[BossService] Updated boss task ${bossTaskId}: HP ${newHp}/${maxHp}`);
    }
    /**
     * Scans a specific project for a Boss task.
     */
    static async scanProjectForBoss(projectId: string): Promise<BossResult | null> {
        try {
            const allTasks = await PluginService.api.getTasks() as unknown as Task[];
            // FIX: Allow checking subtasks too. The boss might be a subtask of a "Step" task.
            const projectTasks = allTasks.filter(t => t.projectId === projectId);

            PluginService.log.info(`[BossService] Scanning ${projectTasks.length} root tasks in project ${projectId} for boss.`);

            const bossTask = projectTasks.find(t => {
                if (t.isDone) return false;
                return !!this.extractBossConfig(t);
            });

            if (bossTask) {
                const config = this.extractBossConfig(bossTask);
                if (config) {
                    return { config, taskId: bossTask.id };
                }
            }
        } catch (e) {
            PluginService.log.error('BossService: Error scanning project for boss', e);
        }
        return null;
    }
}

