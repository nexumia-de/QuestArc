import type {
    PluginAPI as PluginAPIBase,
} from '@super-productivity/plugin-api';

// Augment PluginAPI to include missing methods that exist at runtime
export interface ExtendedPluginAPI extends PluginAPIBase {
    log: {
        info(msg: string, ...args: any[]): void;
        warn(msg: string, ...args: any[]): void;
        error(msg: string, ...args: any[]): void;
    };
    onMessage?: (handler: (message: any) => Promise<any> | any) => void;
    // Missing methods from PluginAPIBase or needed overrides
    // Missing methods from PluginAPIBase or needed overrides
    getAllProjects(): Promise<any[]>;
    addProject(project: any): Promise<string>;
    addTask(task: any): Promise<string>;
    updateTask(taskId: string, updates: any): Promise<void>;
}

declare const PluginAPI: ExtendedPluginAPI;

export class PluginService {
    static get api(): ExtendedPluginAPI {
        if (typeof PluginAPI === 'undefined') {
            throw new Error('PluginAPI is not defined. Only available in Super Productivity context.');
        }
        return PluginAPI;
    }

    static async loadState(): Promise<string | undefined> {
        const data = await this.api.loadSyncedData();
        return data || undefined;
    }

    static async saveState(state: string): Promise<void> {
        await this.api.persistDataSynced(state);
    }

    static log = {
        info: (msg: string, ...args: any[]) => {
            if (this.api.log?.info) this.api.log.info(msg, ...args);
            else console.log(`[QuestArc INFO] ${msg}`, ...args);
        },
        warn: (msg: string, ...args: any[]) => {
            if (this.api.log?.warn) this.api.log.warn(msg, ...args);
            else console.warn(`[QuestArc WARN] ${msg}`, ...args);
        },
        error: (msg: string, ...args: any[]) => {
            if (this.api.log?.error) this.api.log.error(msg, ...args);
            else console.error(`[QuestArc ERROR] ${msg}`, ...args);
        },
        debug: (msg: string, ...args: any[]) => console.debug(`[QuestArc DEBUG] ${msg}`, ...args),
    };

    static showSnack(msg: string, type: 'SUCCESS' | 'ERROR') {
        this.api.showSnack({ msg, type });
    }
}
