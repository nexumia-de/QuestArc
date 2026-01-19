
import { describe, it, expect } from 'vitest';
import { processTaskCompletion } from './game-logic';
import { TaskStub } from '../services/TaskService'; // Mock or interface
import { createInitialState } from './state/persistence';
import { compileTaskData } from './parsers';

// Mimic local TaskStub from game-logic
interface TaskStub {
    id: string;
    title: string;
    notes?: string;
    isDone: boolean;
    tagIds: string[];
}

describe('Habit Logic & Looping Fix', () => {

    it('should increment habit progress on completion and update notes with lastUpdated', () => {
        let state = createInitialState();

        // Mock Habit Task: 2x @daily
        // Initial state: 0/2
        const habitTask: TaskStub = {
            id: 't1',
            title: '2x @daily Drink Water',
            notes: '',
            isDone: false,
            tagIds: []
        };

        // 1st Completion
        const result1 = processTaskCompletion(state, habitTask);
        const updates1 = result1.taskUpdates!;

        // Parse QuestData from updates
        const qd1 = JSON.parse(updates1.notes!.match(/```json\s*([\s\S]*?)\s*```/)![1]);

        expect(qd1.meta.type).toBe('HABIT');
        expect(qd1.progress.current).toBe(1);
        expect(qd1.progress.target).toBe(2);
        expect(qd1.progress.lastUpdated).toBeDefined(); // Should have timestamp
        expect(updates1.isDone).toBe(false); // Should NOT be done yet
        expect(updates1.title).toContain('(1/2)');

        // Update task for next run
        const habitTask2: TaskStub = {
            ...habitTask,
            title: updates1.title!,
            notes: updates1.notes,
            isDone: false
        };

        // 2nd Completion
        const result2 = processTaskCompletion(state, habitTask2);
        const updates2 = result2.taskUpdates!;
        const qd2 = JSON.parse(updates2.notes!.match(/```json\s*([\s\S]*?)\s*```/)![1]);

        expect(qd2.progress.current).toBe(2);
        expect(updates2.isDone).toBe(true); // Should be done now
        expect(updates2.title).toContain('(2/2)');

        // 3rd Completion (Over-completion / Looping check)
        // If user clicks it AGAIN while it is done? Or if system re-processes it?

        const habitTask3: TaskStub = {
            ...habitTask2,
            title: updates2.title!,
            notes: updates2.notes,
            isDone: true // It is already done
        };

        // Logic should probably just return same state or increment? 
        // In game-logic, we increment regardless.
        const result3 = processTaskCompletion(state, habitTask3);
        const updates3 = result3.taskUpdates!;
        const qd3 = JSON.parse(updates3.notes!.match(/```json\s*([\s\S]*?)\s*```/)![1]);

        expect(qd3.progress.current).toBe(3);
        expect(updates3.isDone).toBe(true); // Still done
    });

    it('should generate a timestamp that is recent', () => {
        let state = createInitialState();
        const habitTask: TaskStub = {
            id: 't2',
            title: '1x @daily Stretch',
            notes: '',
            isDone: false,
            tagIds: []
        };

        const result = processTaskCompletion(state, habitTask);
        const qd = JSON.parse(result.taskUpdates!.notes!.match(/```json\s*([\s\S]*?)\s*```/)![1]);

        const now = Date.now();
        expect(now - qd.progress.lastUpdated).toBeLessThan(1000); // within 1 second
    });

});
