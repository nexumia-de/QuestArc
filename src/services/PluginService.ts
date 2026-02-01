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
        info: (msg: string, ...args: any[]) => this.api.log.info(msg, ...args),
        warn: (msg: string, ...args: any[]) => this.api.log.warn(msg, ...args),
        error: (msg: string, ...args: any[]) => this.api.log.error(msg, ...args),
        debug: (msg: string, ...args: any[]) => console.debug(`[QuestArc DEBUG] ${msg}`, ...args),
    };

    static showSnack(msg: string, type: 'SUCCESS' | 'ERROR') {
        this.api.showSnack({ msg, type });
    }
}
