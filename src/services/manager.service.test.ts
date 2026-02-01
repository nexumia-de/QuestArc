import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuestManagerService } from './manager.service';
import { CompilerService } from './compiler.service';
import { PluginService } from './PluginService';
import { BossService } from './BossService';
import { QuestArcState } from '../types/state';

const mockApi = {
    getAllProjects: vi.fn(),
    updateProject: vi.fn(),
    log: { error: vi.fn(), info: vi.fn() }
};

const mockState: QuestArcState = {
    version: 1,
    profile: {} as any,
    stories: [],
    completedStories: [],
    activeStory: {
        id: null,
        currentStepId: 0,
        taskProgress: {},
        isCompleted: false
    },
    activeBoss: null
};

describe('QuestManagerService', () => {
    beforeEach(() => {
        // Mock PluginService.api
        vi.spyOn(PluginService, 'api', 'get').mockReturnValue(mockApi as any);
        vi.clearAllMocks();

        // Mock Compiler
        vi.spyOn(CompilerService, 'compileQuest').mockResolvedValue('new-id');

        // Mock BossService
        vi.spyOn(BossService, 'scanProjectForBoss').mockResolvedValue(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should start a quest successfully', async () => {
        const result = await QuestManagerService.startQuest('t1', mockState);
        expect(CompilerService.compileQuest).toHaveBeenCalledWith('t1');
        expect(result.activeStory.id).toBe('new-id');
        expect(result.activeBoss).toBeNull();
    });

    it('should detect boss on start', async () => {
        const bossConfig = { name: 'Boss', hp: 100, maxHp: 100, isDead: false, themeColor: '#f00' };
        vi.spyOn(BossService, 'scanProjectForBoss').mockResolvedValue({
            config: bossConfig,
            taskId: 'b1'
        });

        const result = await QuestManagerService.startQuest('t1', mockState);
        expect(result.activeBoss).toEqual(expect.objectContaining({ name: 'Boss', hp: 100 }));
    });

    it('should throw if active quest exists when starting', async () => {
        const activeState = {
            ...mockState,
            activeStory: { ...mockState.activeStory, id: 'a1' }
        };

        await expect(QuestManagerService.startQuest('t1', activeState)).rejects.toThrow('active quest is already running');
        expect(CompilerService.compileQuest).not.toHaveBeenCalled();
    });

    it('should pause a quest', async () => {
        mockApi.getAllProjects.mockResolvedValue([
            { id: 'a1', title: 'My Quest 🧭', icon: '🏹' }
        ]);

        const activeState = {
            ...mockState,
            activeStory: { ...mockState.activeStory, id: 'a1' }
        };

        const result = await QuestManagerService.pauseQuest(activeState);

        expect(mockApi.updateProject).toHaveBeenCalledWith('a1', { title: 'My Quest ⏸️' });
        expect(result.activeStory.id).toBeNull();
    });

    it('should resume a quest', async () => {
        mockApi.getAllProjects.mockResolvedValue([
            { id: 'p1', title: 'My Quest ⏸️', icon: '🏹' }
        ]);

        const result = await QuestManagerService.resumeQuest('p1', mockState);

        expect(mockApi.updateProject).toHaveBeenCalledWith('p1', { title: 'My Quest 🧭' });
        expect(result.activeStory.id).toBe('p1');
    });
});
