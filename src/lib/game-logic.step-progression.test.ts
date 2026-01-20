
import { describe, it, expect } from 'vitest';
import { processTaskCompletion } from './game-logic';
import { createInitialState } from './state/persistence';
import { StoryStep } from '../types/state';

// Stub
interface TaskStub {
    id: string;
    title: string;
    notes?: string;
    isDone: boolean;
    tagIds: string[];
}

describe('Habit Step Progression', () => {

    it('should only increment step progress when habit reaches daily target', () => {
        let state = createInitialState();

        // Define Step
        const step: StoryStep = {
            id: 1,
            title: 'Hydration Challenge',
            xpReward: 100,
            completion: {
                type: 'tasks_completed'
            },
            tasksToCreate: [
                {
                    title: 'Drink Water [count:2] [freq:daily]',
                    requiredCount: 2, // Needs 2 "Days" of completion
                    isAutoCreate: true
                }
            ]
        };

        // Define Task: [count:2] [freq:daily]
        const habitTask: TaskStub = {
            id: 't1',
            title: 'Drink Water [count:2] [freq:daily]',
            notes: '',
            isDone: false,
            tagIds: []
        };

        // 1. Tick 1 (0/2 -> 1/2)
        let result = processTaskCompletion(state, habitTask, step);
        let updates = result.taskUpdates!;

        expect(updates.isDone).toBe(false);
        expect(updates.title).toContain('(1/2)');

        // Check Step Progress (Should be 0)
        expect(result.newState.activeStory.taskProgress['Drink Water [count:2] [freq:daily]']).toBeUndefined();

        state = result.newState; // Update state for next tick

        // Update task with new notes/title
        const habitTaskTick2: TaskStub = {
            ...habitTask,
            title: updates.title!,
            notes: updates.notes,
            isDone: false
        };

        // 2. Tick 2 (1/2 -> 2/2)
        result = processTaskCompletion(state, habitTaskTick2, step);
        updates = result.taskUpdates!;

        expect(updates.isDone).toBe(true);
        expect(updates.title).toContain('(2/2)');

        // Check Step Progress (Should be 1)
        expect(result.newState.activeStory.taskProgress['Drink Water [count:2] [freq:daily]']).toBe(1);

        // Check Step Completion (Target is 2, so not done yet)
        expect(result.stepCompleted).toBe(false);

        state = result.newState;

        // --- Simulated Day 2 ---

        const habitTaskDay2: TaskStub = {
            id: 't1',
            title: 'Drink Water [count:2] [freq:daily]', // Reset title
            notes: '',
            isDone: false,
            tagIds: []
        };

        // Tick 1 Day 2
        result = processTaskCompletion(state, habitTaskDay2, step);
        expect(result.newState.activeStory.taskProgress['Drink Water [count:2] [freq:daily]']).toBe(1); // Unchanged
        state = result.newState;

        // Tick 2 Day 2
        const habitTaskDay2Tick2 = {
            ...habitTaskDay2,
            title: result.taskUpdates!.title!,
            notes: result.taskUpdates!.notes
        };

        result = processTaskCompletion(state, habitTaskDay2Tick2, step);
        expect(result.newState.activeStory.taskProgress['Drink Water [count:2] [freq:daily]']).toBe(2); // Incremented!

        // Check Step Completion (Target is 2, now we have 2)
        expect(result.stepCompleted).toBe(true);
    });

    it('should increment step progress for simple tasks immediately', () => {
        let state = createInitialState();
        const step: StoryStep = {
            id: 2,
            title: 'Simple Step',
            xpReward: 50,
            completion: { type: 'tasks_completed' },
            tasksToCreate: [{ title: 'Read Book', requiredCount: 1, isAutoCreate: true }]
        };

        const task: TaskStub = {
            id: 't2',
            title: 'Read Book',
            notes: '',
            isDone: false,
            tagIds: []
        };

        const result = processTaskCompletion(state, task, step);
        expect(result.newState.activeStory.taskProgress['Read Book']).toBe(1);
        expect(result.stepCompleted).toBe(true);
    });
});
