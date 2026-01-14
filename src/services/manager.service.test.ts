import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuestManagerService } from './manager.service';
import { ProjectScannerService } from './scanner.service';
import { CompilerService } from './compiler.service';

const mockPluginAPI = {
    getAllProjects: vi.fn(),
    updateProject: vi.fn(),
};

describe('QuestManagerService', () => {
    beforeEach(() => {
        vi.stubGlobal('PluginAPI', mockPluginAPI);
        vi.clearAllMocks();

        // Mock Scanner to return predictable state
        vi.spyOn(ProjectScannerService, 'scan').mockResolvedValue({
            active: null,
            templates: [],
            paused: [],
            warnings: []
        });

        // Mock Compiler
        vi.spyOn(CompilerService, 'compileQuest').mockResolvedValue('new-id');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('should start a quest successfully', async () => {
        await QuestManagerService.startQuest('t1');
        expect(CompilerService.compileQuest).toHaveBeenCalledWith('t1');
        expect(ProjectScannerService.scan).toHaveBeenCalledTimes(2); // 1 check, 1 return
    });

    it('should throw if active quest exists when starting', async () => {
        vi.spyOn(ProjectScannerService, 'scan').mockResolvedValue({
            active: { id: 'a1', title: 'Active 🧭', originalTitle: 'Active', type: 'ACTIVE' },
            templates: [],
            paused: [],
            warnings: []
        });

        await expect(QuestManagerService.startQuest('t1')).rejects.toThrow('active quest is already running');
        expect(CompilerService.compileQuest).not.toHaveBeenCalled();
    });

    it('should pause a quest', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: 'a1', title: 'My Quest 🧭', icon: '🏹' }
        ]);

        await QuestManagerService.pauseQuest('a1');

        expect(mockPluginAPI.updateProject).toHaveBeenCalledWith('a1', { title: 'My Quest ⏸️' });
        expect(ProjectScannerService.scan).toHaveBeenCalled();
    });

    it('should resume a quest', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: 'p1', title: 'My Quest ⏸️', icon: '🏹' }
        ]);

        await QuestManagerService.resumeQuest('p1');

        expect(mockPluginAPI.updateProject).toHaveBeenCalledWith('p1', { title: 'My Quest 🧭' });
        expect(ProjectScannerService.scan).toHaveBeenCalledTimes(2); // 1 check conflict, 1 return
    });
});
