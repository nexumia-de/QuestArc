
import { PluginApi, Project, Task } from '../types/plugin-api';

const mockProjects: Project[] = [
    { id: '1', title: '📜 Story Template', icon: '🏹' },
    { id: '2', title: 'Running Quest 🧭', icon: '🏹' },
    { id: '3', title: 'Paused Quest ⏸️', icon: '🏹' },
    { id: '4', title: 'Work Stuff', icon: 'laptop' }
];

const mockTasks: Task[] = [];

export const MockPluginAPI: PluginApi = {
    // Projects
    async getAllProjects() {
        console.log('[Mock] getAllProjects', mockProjects);
        return [...mockProjects];
    },
    async addProject(project: Partial<Project>) {
        console.log('[Mock] addProject', project);
        const id = 'mock-proj-' + Date.now();
        mockProjects.push({ ...project, id, title: project.title || 'New Project', icon: project.icon || '🏹' });
        return id;
    },
    async updateProject(projectId: string, updates: Partial<Project>) {
        console.log('[Mock] updateProject', projectId, updates);
        const p = mockProjects.find(pro => pro.id === projectId);
        if (p) {
            Object.assign(p, updates);
        }
    },

    // Tasks
    async getTasks() {
        return [...mockTasks];
    },
    async addTask(task: Partial<Task>) {
        console.log('[Mock] addTask', task);
        const id = 'mock-task-' + Date.now();
        mockTasks.push({ ...task, id, title: task.title || 'New Task' });
        return id;
    },
    async updateTask(taskId: string, updates: Partial<Task>) {
        console.log('[Mock] updateTask', taskId, updates);
        const t = mockTasks.find(task => task.id === taskId);
        if (t) {
            Object.assign(t, updates);
        }
    }
};

// Initialize global if undefined
if (typeof (window as any).PluginAPI === 'undefined') {
    console.warn('PluginAPI not found (Dev Mode). Using Mock.');
    (window as any).PluginAPI = MockPluginAPI;
}
