
import { describe, it, expect } from 'vitest';
import { processTaskCompletion } from './game-logic';
import { createInitialState } from './state/persistence';
import { compileTaskData } from './parsers';

describe('Streak Logic', () => {

    it('should parse streak tag', () => {
        const title = '2x @daily Drink Water streak:3';
        const { data, title: clean } = compileTaskData(title);

        expect(data.meta.type).toBe('HABIT');
        expect(data.progress?.streak).toBeDefined();
        expect(data.progress?.streak?.target).toBe(3);
        expect(clean).toBe('Drink Water');
    });

    it('should increment streak when daily target is met', () => {
        let state = createInitialState();
        const task = {
            id: 't1',
            title: '1x @daily Stretch streak:5',
            notes: '',
            isDone: false,
            tagIds: []
        };

        // Complete it
        const result = processTaskCompletion(state, task);
        const updates = result.taskUpdates!;

        // Check JSON
        const qd = JSON.parse(updates.notes!.match(/```json\s*([\s\S]*?)\s*```/)![1]);

        expect(qd.progress.streak.current).toBe(1);
        expect(updates.title).toContain('🔥 1/5');
        expect(updates.isDone).toBe(true);
    });

    it('should NOT increment streak if daily target NOT met', () => {
        let state = createInitialState();
        const task = {
            id: 't2',
            title: '2x @daily Pushups streak:10',
            notes: '',
            isDone: false,
            tagIds: []
        };

        // 1st Rep
        const result = processTaskCompletion(state, task);
        const updates = result.taskUpdates!;
        const qd = JSON.parse(updates.notes!.match(/```json\s*([\s\S]*?)\s*```/)![1]);

        expect(qd.progress.current).toBe(1);
        expect(qd.progress.streak.current).toBe(0); // No streak yet
        expect(updates.title).not.toContain('🔥');
    });

    it('should parse bracketed streak tag [streak:3]', () => {
        const title = '2x @daily Drink Water [streak:3]';
        const { data, title: clean } = compileTaskData(title);

        expect(data.meta.type).toBe('HABIT');
        expect(data.progress?.streak?.target).toBe(3);
        expect(clean).toBe('Drink Water');
    });

    it('should parse shorthand streak tag s:3', () => {
        const title = '2x @daily Drink Water s:3';
        const { data, title: clean } = compileTaskData(title);

        expect(data.progress?.streak?.target).toBe(3);
        expect(clean).toBe('Drink Water');
    });

});
