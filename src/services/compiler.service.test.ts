import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompilerService } from './compiler.service';
import { Task, Project } from '../types/plugin-api';

// Mock the global PluginAPI
const mockPluginAPI = {
    getAllProjects: vi.fn(),
    addProject: vi.fn(),
    getTasks: vi.fn(),
    addTask: vi.fn(),
};

// @ts-ignore
global.PluginAPI = mockPluginAPI;

describe('CompilerService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockTasks: Task[] = [
        { id: 't1', title: 'Chapter 1 [XP:100]', projectId: 'p1', notes: 'Intro notes', subTaskIds: ['t2'] },
        { id: 't2', title: '50x Pushups', projectId: 'p1', parentId: 't1' }, // Subtask of t1
        { id: 't3', title: 'Just a task', projectId: 'p1' },
        { id: 't_other', title: 'Ignore me', projectId: 'p_other' },
    ];

    const mockProjects: Project[] = [
        { id: 'p1', title: '📜 My Story' },
        { id: 'p_other', title: 'Other Project' },
    ];

    it('should compile a quest successfully', async () => {
        // Setup Mocks
        mockPluginAPI.getAllProjects.mockResolvedValue(mockProjects);
        mockPluginAPI.getTasks.mockResolvedValue(mockTasks);
        mockPluginAPI.addProject.mockResolvedValue('new_p_id');
        mockPluginAPI.addTask.mockResolvedValue('new_t_id');

        // Execute
        const newProjectId = await CompilerService.compileQuest('p1');

        // Verify Project Creation
        expect(mockPluginAPI.addProject).toHaveBeenCalledWith({
            title: 'My Story 🧭',
        });
        expect(newProjectId).toBe('new_p_id');

        // Verify Task Creation (Recursive)
        // Expect 3 tasks to be added (t1, t2, t3) from p1. t_other should be ignored.
        expect(mockPluginAPI.addTask).toHaveBeenCalledTimes(3);

        // Verify Task 1 (Parent)
        // The parser removes [XP:100]
        expect(mockPluginAPI.addTask).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Chapter 1',
            projectId: 'new_p_id',
            parentId: undefined,
            notes: expect.stringContaining('"QUEST_DATA"'),
        }));

        // Verify Task 2 (Subtask)
        // The parser removes 50x
        expect(mockPluginAPI.addTask).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Pushups',
            projectId: 'new_p_id',
            // Since we mock return value 'new_t_id' for all calls, parentId will be 'new_t_id'
            // Ideally we should mock different returns to verify hierarchy, but this checks the call.
            parentId: 'new_t_id',
            notes: expect.stringContaining('"type": "GRIND"'),
        }));
    });

    it('should throw error if template project not found', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([]);
        await expect(CompilerService.compileQuest('missing_id')).rejects.toThrow('not found');
    });
});
