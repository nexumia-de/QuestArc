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

export interface Tag {
  id: string;
  title: string;
  color?: string;
}

export interface TaskStub {
  id: string;
  tagIds: string[];
  title: string;
  notes?: string;
  resolvedTagNames?: string[];
}

export type PluginAPI = {
  // Projects
  getAllProjects(): Promise<Project[]>;
  addProject(project: Partial<Project>): Promise<string>; // Returns ID
  updateProject(projectId: string, updates: Partial<Project>): Promise<void>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  addTask(task: Partial<Task>): Promise<string>; // Returns ID
  updateTask(taskId: string, updates: Partial<Task>): Promise<void>;

  // Tags
  getAllTags(): Promise<Tag[]>;

  // UI Operations
  notify(notification: { title: string; body: string; ico?: string }): void;
  showSnack(options: {
    msg: string;
    type?: "SUCCESS" | "ERROR" | "INFO" | "WARNING";
    ico?: string;
    actionStr?: string;
    actionFn?: () => void;
  }): void;

  // Hooks
  registerHook(hookName: string, callback: (payload: any) => void): void;
  Hooks: {
    TASK_COMPLETE: string;
    TASK_UPDATE: string;
    // ... add others as needed
  };
};

// In the real app, PluginAPI is globally available
declare global {
  const PluginAPI: PluginApi;
}
