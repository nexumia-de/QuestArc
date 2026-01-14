import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProjectScannerService } from './scanner.service';

const mockPluginAPI = {
    getAllProjects: vi.fn(),
};

describe('ProjectScannerService', () => {
    beforeEach(() => {
        vi.stubGlobal('PluginAPI', mockPluginAPI);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should classify projects correctly', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: '1', title: '📜 Template 1', icon: '🏹' },
            { id: '2', title: 'Active Quest 🧭', icon: '🏹' },
            { id: '3', title: 'Paused Quest ⏸️', icon: '🏹' },
            { id: '4', title: 'Normal Project', icon: 'check' }, // Should be ignored
            { id: '5', title: 'Unknown Quest', icon: '🏹' }, // Unknown type
        ]);

        const result = await ProjectScannerService.scan();

        expect(result.templates).toHaveLength(1);
        expect(result.templates[0]?.title).toBe('📜 Template 1');
        expect(result.templates[0]?.originalTitle).toBe('Template 1');

        expect(result.active).toBeDefined();
        expect(result.active?.title).toBe('Active Quest 🧭');
        expect(result.active?.originalTitle).toBe('Active Quest');

        expect(result.paused).toHaveLength(1);
        expect(result.paused[0]?.title).toBe('Paused Quest ⏸️');

        // "Unknown Quest" is ignored in current logic or handled as UNKNOWN (which is not in the env interface?)
        // The scan() method ignores UNKNOWN types in the switch.
    });

    it('should accept projects without the bow icon if they match patterns (but warn)', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: '1', title: '📜 Template 1' }, // No icon
        ]);

        const result = await ProjectScannerService.scan();
        expect(result.templates).toHaveLength(1);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('missing the 🏹 icon');
    });

    it('should warn if multiple active quests exist', async () => {
        const consoleSpy = vi.spyOn(console, 'warn');
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: '1', title: 'Active 1 🧭', icon: '🏹' },
            { id: '2', title: 'Active 2 🧭', icon: '🏹' },
        ]);

        const result = await ProjectScannerService.scan();
        expect(result.active?.id).toBe('1'); // First one wins
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Multiple active quests detected'));
    });

    it('should detect quests without icon but warn', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: '1', title: 'Hidden Quest 🧭' }, // No icon
        ]);

        const result = await ProjectScannerService.scan();
        expect(result.active?.id).toBe('1');
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('missing the 🏹 icon');
    });

    it('should ignore generic projects with icon but no suffix', async () => {
        mockPluginAPI.getAllProjects.mockResolvedValue([
            { id: '1', title: 'Generic Project', icon: '🏹' },
        ]);

        const result = await ProjectScannerService.scan();
        expect(result.active).toBeNull();
        expect(result.templates).toHaveLength(0);
        expect(result.paused).toHaveLength(0);
    });
});
