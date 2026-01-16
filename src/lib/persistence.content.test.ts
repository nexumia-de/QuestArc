import { describe, it, expect } from 'vitest';
import { Persistence } from './persistence';

describe('Persistence (Content)', () => {
    it('should load default state with Productivity Mastery story', () => {
        // Mock empty localStorage
        const getItemSpy = global.localStorage.getItem = () => null;

        const state = Persistence.loadState();

        expect(state.stories.length).toBeGreaterThan(0);
        const story = state.stories.find(s => s.id === 'story_productivity_mastery');
        expect(story).toBeDefined();

        expect(story?.title).toBe('Productivity Mastery');
        expect(story?.steps.length).toBe(4);

        // Verify Boss Step
        const bossStep = story?.steps.find(s => s.id === 2);
        expect(bossStep?.completion.type).toBe('boss_defeat');
        expect(bossStep?.completion.config?.boss?.name).toBe('Procrastination Demon');
    });

    it('should default to active story', () => {
        const state = Persistence.loadState();
        expect(state.activeStory.id).toBe('story_productivity_mastery');
    });
});
