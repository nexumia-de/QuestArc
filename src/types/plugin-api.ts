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

    // Other...
}

// In the real app, PluginAPI is globally available
declare global {
    const PluginAPI: PluginApi;
}
