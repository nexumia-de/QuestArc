import { describe, it, expect } from 'vitest';
import { processTaskCompletion } from './game-logic';
import { createInitialState } from './state/persistence';
import { StoryStep } from '../types/state';

describe('Boss Logic Rules - Subtasks', () => {

    const bossStep: StoryStep = {
        id: 1,
        title: 'Boss Battle',
        completion: {
            type: 'boss_defeat'
        },
        xpReward: 100
    };

    it('should deal damage if Subtask WITHOUT tag has Parent WITH tag', () => {
        let state = createInitialState();
        state.activeBoss = { hp: 100, maxHp: 100, isDead: false };

        const parentTask = {
            tagIds: [],
            title: 'Parent Task #QuestArc',
            notes: ''
        };

        const result = processTaskCompletion(state, {
            tagIds: [],
            title: 'Subtask',
            notes: ''
        } as any, bossStep, parentTask);

        expect(result.damageDealt).toBeGreaterThan(0);
        expect(result.newState.activeBoss!.hp).toBeLessThan(100);
    });

    it('should NOT deal damage if Subtask WITHOUT tag has Parent WITHOUT tag', () => {
        let state = createInitialState();
        state.activeBoss = { hp: 100, maxHp: 100, isDead: false };

        const parentTask = {
            tagIds: [],
            title: 'Parent Task',
            notes: ''
        };

        const result = processTaskCompletion(state, {
            tagIds: [],
            title: 'Subtask',
            notes: ''
        } as any, bossStep, parentTask);

        expect(result.damageDealt).toBe(0);
        expect(result.newState.activeBoss!.hp).toBe(100);
    });

    it('should deal damage if Subtask WITH tag has Parent WITHOUT tag', () => {
        let state = createInitialState();
        state.activeBoss = { hp: 100, maxHp: 100, isDead: false };

        const parentTask = {
            tagIds: [],
            title: 'Parent Task',
            notes: ''
        };

        const result = processTaskCompletion(state, {
            tagIds: [],
            title: 'Subtask #QuestArc',
            notes: ''
        } as any, bossStep, parentTask);

        expect(result.damageDealt).toBeGreaterThan(0);
    });

    it('should DEAL damage if DEEP subtask (Level 2) has Root Ancestor WITH tag', () => {
        let state = createInitialState();
        state.activeBoss = { hp: 100, maxHp: 100, isDead: false };

        // Root Task has #QuestArc
        const rootTask = {
            tagIds: [],
            title: 'Root Task #QuestArc',
            notes: ''
        };

        // We simulate passing the rootTask found via recursion
        const result = processTaskCompletion(state, {
            tagIds: [],
            title: 'Deep Subtask',
            notes: ''
        } as any, bossStep, rootTask);

        expect(result.damageDealt).toBeGreaterThan(0);
    });

    it('should NOT deal damage if subtask has no tagged root ancestor', () => {
        let state = createInitialState();
        state.activeBoss = { hp: 100, maxHp: 100, isDead: false };

        const rootTask = {
            tagIds: [],
            title: 'Root Task', // No Tag
            notes: ''
        };

        const result = processTaskCompletion(state, {
            tagIds: [],
            title: 'Deep Subtask',
            notes: ''
        } as any, bossStep, rootTask);

        expect(result.damageDealt).toBe(0);
    });

    it('should deal damage if Root Task WITH tag (no parent)', () => {
        let state = createInitialState();
        state.activeBoss = { hp: 100, maxHp: 100, isDead: false };

        const result = processTaskCompletion(state, {
            tagIds: [],
            title: 'Root Task #QuestArc',
            notes: ''
        } as any, bossStep, undefined); // No parent

        expect(result.damageDealt).toBeGreaterThan(0);
    });

    it('should NOT deal damage if Root Task WITHOUT tag (no parent)', () => {
        let state = createInitialState();
        state.activeBoss = { hp: 100, maxHp: 100, isDead: false };

        const result = processTaskCompletion(state, {
            tagIds: [],
            title: 'Root Task',
            notes: ''
        } as any, bossStep, undefined); // No parent

        expect(result.damageDealt).toBe(0);
    });
    it('should DEAL damage if task belongs to Quest Project (isQuestTask=true), even without tags', () => {
        let state = createInitialState();
        state.activeBoss = { hp: 100, maxHp: 100, isDead: false };

        const rootTask = {
            tagIds: [],
            title: 'Untagged Root Task',
            notes: ''
        };

        const result = processTaskCompletion(state, {
            tagIds: [],
            title: 'Untagged Subtask',
            notes: ''
        } as any, bossStep, rootTask, true); // isQuestTask = true

        expect(result.damageDealt).toBeGreaterThan(0);
    });
});
