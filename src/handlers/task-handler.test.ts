import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskHandler } from './task-handler';
import { Persistence } from '../lib/persistence';
import { processTaskCompletion } from '../lib/game-logic';

// Mock dependencies
vi.mock('../lib/persistence');
vi.mock('../lib/game-logic');

const mockPluginAPI = {
    getTasks: vi.fn(),
    updateTask: vi.fn(),
    notify: vi.fn(),
    showSnack: vi.fn()
};

const mockState = {
    activeStory: {
        id: 'story1',
        currentStepId: 1,
        taskProgress: {}
    },
    stories: [
        {
            id: 'story1',
            steps: [
                { id: 1, title: 'Step 1', nextStepId: 2, tasksToCreate: [] }
            ]
        }
    ],
    profile: {
        level: 1,
        xp: 0
    }
};

describe('TaskHandler', () => {
    beforeEach(() => {
        vi.stubGlobal('PluginAPI', mockPluginAPI);
        vi.clearAllMocks();

        // Setup default mocks
        (Persistence.loadState as any).mockReturnValue(mockState);
        (mockPluginAPI.getTasks as any).mockResolvedValue([
            { id: 't1', title: 'Task 1', tagIds: [] }
        ]);
        (processTaskCompletion as any).mockReturnValue({
            newState: mockState,
            damageDealt: 0,
            xpGained: 0,
            stepCompleted: false,
            leveledUp: false
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should ignore if no active story', async () => {
        (Persistence.loadState as any).mockReturnValue({ activeStory: { id: null } });
        await TaskHandler.handleTaskComplete('t1');
        expect(processTaskCompletion).not.toHaveBeenCalled();
    });

    it('should handle task object directly (Performance Optimization)', async () => {
        const taskObj = { id: 't1', title: 'Task 1' };

        await TaskHandler.handleTaskComplete(taskObj as any);

        // Should NOT call getTasks
        expect(mockPluginAPI.getTasks).not.toHaveBeenCalled();
        expect(processTaskCompletion).toHaveBeenCalled();
    });

    it('should notify XP gain', async () => {
        (processTaskCompletion as any).mockReturnValue({
            newState: mockState,
            damageDealt: 0,
            xpGained: 50,
            stepCompleted: false,
            leveledUp: false
        });

        await TaskHandler.handleTaskComplete('t1');

        expect(mockPluginAPI.notify).toHaveBeenCalledWith(expect.objectContaining({
            title: 'XP Gained! ✨',
            body: '+50 XP'
        }));
    });

    it('should notify Level Up', async () => {
        (processTaskCompletion as any).mockReturnValue({
            newState: mockState,
            damageDealt: 0,
            xpGained: 100,
            stepCompleted: false,
            leveledUp: true
        });

        await TaskHandler.handleTaskComplete('t1');

        expect(mockPluginAPI.notify).toHaveBeenCalledWith(expect.objectContaining({
            title: 'LEVEL UP! 🎉'
        }));
    });

    it('should advance step on completion', async () => {
        const newState = JSON.parse(JSON.stringify(mockState));
        (processTaskCompletion as any).mockReturnValue({
            newState: newState,
            damageDealt: 0,
            xpGained: 0,
            stepCompleted: true, // Step completed!
            leveledUp: false
        });

        await TaskHandler.handleTaskComplete('t1');

        expect(mockPluginAPI.notify).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Step Complete! 📜'
        }));
        expect(Persistence.saveState).toHaveBeenCalled();
    });

    it('should update task for Grind (remain incomplete)', async () => {
        const taskObj = {
            id: 't-grind',
            title: '50x Pushups',
            notes: '```json\n{"meta":{"type":"GRIND"},"progress":{"current":0,"target":50}}\n```'
        };

        // Mock processTaskCompletion to return taskUpdates
        (processTaskCompletion as any).mockReturnValue({
            newState: mockState,
            damageDealt: 0,
            xpGained: 1,
            stepCompleted: false,
            leveledUp: false,
            taskUpdates: { isDone: false, notes: '...' }
        });

        await TaskHandler.handleTaskComplete(taskObj as any);

        expect(processTaskCompletion).toHaveBeenCalled();
        expect(mockPluginAPI.updateTask).toHaveBeenCalledWith(
            't-grind',
            expect.objectContaining({ isDone: false })
        );
    });
});
