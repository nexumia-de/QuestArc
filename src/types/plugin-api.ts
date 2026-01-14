// Basic type definitions based on docs/SUPER_PRODUCTIVITY_API.md

export interface Task {
    id: string;
    title: string;
    notes?: string;
    projectId?: string;
    parentId?: string;
    isDone?: boolean;
    subTaskIds?: string[];
    tagIds?: string[];
}

export interface Project {
    id: string;
    title: string;
    icon?: string;
    isArchived?: boolean;
}

export interface PluginApi {
    // Projects
    getAllProjects(): Promise<Project[]>;
    addProject(project: Partial<Project>): Promise<string>; // Returns ID
    updateProject(projectId: string, updates: Partial<Project>): Promise<void>;

    // Tasks
    getTasks(): Promise<Task[]>;
    addTask(task: Partial<Task>): Promise<string>; // Returns ID
    updateTask(taskId: string, updates: Partial<Task>): Promise<void>;

    // UI Operations
    notify(notification: { title: string; body: string; ico?: string }): void;
    showSnack(options: { msg: string; type?: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING'; ico?: string; actionStr?: string; actionFn?: () => void }): void;

    // Hooks
    registerHook(hookName: string, callback: (payload: any) => void): void;
    Hooks: {
        TASK_COMPLETE: string;
        TASK_UPDATE: string;
        // ... add others as needed
    };
}

// In the real app, PluginAPI is globally available
declare global {
    const PluginAPI: PluginApi;
}
