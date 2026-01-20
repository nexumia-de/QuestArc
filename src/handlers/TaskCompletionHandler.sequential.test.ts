import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskCompletionHandler } from '../../src/handlers/TaskCompletionHandler';
import { CompilerService } from '../../src/services/compiler.service';
import { PluginService } from '../../src/services/PluginService';

// Mock dependencies
vi.mock('../../src/services/PluginService');
vi.mock('../../src/services/compiler.service');

const mockPluginAPI = {
    getTasks: vi.fn(),
    getAllProjects: vi.fn(),
    updateProject: vi.fn(),
    updateTask: vi.fn()
};
(global as any).PluginAPI = mockPluginAPI;

describe('TaskCompletionHandler - Sequential Robustness', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockState: any = {
        activeStory: { isCompleted: false },
        profile: { xp: 0 },
        activeBoss: null
    };

    it('should use sourceIndex from metadata to determine next task index', async () => {
        // Setup Logic relies on finding a template
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: 'p1', title: 'My Quest 🧭' },
            { id: 't1', title: '📜 My Quest' }
        ]);

        // Mock current tasks in project: 
        // Task A (SourceIndex: 0) -> Completed
        // Task Manual (No SourceIndex) -> Ignored by new logic, but complicates old logic count
        const taskA = {
            id: 'task-a',
            projectId: 'p1',
            title: 'Task A',
            notes: '```json\n{"meta":{"sourceIndex":0}}\n```'
        };

        mockPluginAPI.getTasks.mockResolvedValue([taskA]);

        // Verify CompilerService is called with index 1 (0 + 1)
        const saveCallback = vi.fn();
        await TaskCompletionHandler.handle(mockState, { task: taskA }, saveCallback);

        expect(CompilerService.compileNextTask).toHaveBeenCalledWith(
            't1', // templateId
            'p1', // projectId
            1     // targetIndex (sourceIndex 0 + 1)
        );
    });

    it('should calculate next index correctly even with extra manual tasks', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: 'p1', title: 'My Quest 🧭' },
            { id: 't1', title: '📜 My Quest' }
        ]);

        // Task B (SourceIndex: 1) -> Completed
        // Plus 5 random manual tasks in the project
        const taskB = {
            id: 'task-b',
            projectId: 'p1',
            title: 'Task B',
            notes: '```json\n{"meta":{"sourceIndex":1}}\n```'
        };
        const manualTasks = Array(5).fill(0).map((_, i) => ({ id: `m${i}`, projectId: 'p1', title: 'Manual' }));

        mockPluginAPI.getTasks.mockResolvedValue([taskB, ...manualTasks]);

        const saveCallback = vi.fn();
        await TaskCompletionHandler.handle(mockState, { task: taskB }, saveCallback);

        expect(CompilerService.compileNextTask).toHaveBeenCalledWith(
            't1',
            'p1',
            2     // targetIndex (sourceIndex 1 + 1) - Manual tasks ignored!
        );
    });

    it('should fallback to count if sourceIndex is missing', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: 'p1', title: 'My Quest 🧭' },
            { id: 't1', title: '📜 My Quest' }
        ]);

        // Legacy Task (No meta)
        const legacyTask = {
            id: 'legacy',
            projectId: 'p1',
            title: 'Legacy Task'
        };

        // If it's the only task, count = 1
        mockPluginAPI.getTasks.mockResolvedValue([legacyTask]);

        const saveCallback = vi.fn();
        await TaskCompletionHandler.handle(mockState, { task: legacyTask }, saveCallback);

        expect(CompilerService.compileNextTask).toHaveBeenCalledWith(
            't1',
            'p1',
            1     // count (1)
        );
    });
});
