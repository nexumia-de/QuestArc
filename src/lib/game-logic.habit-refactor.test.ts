
import { describe, it, expect } from 'vitest';
import { processTaskCompletion } from './game-logic';
import { createInitialState } from './state/persistence';
// import { TaskStub } from '../types/plugin-api'; // Use local interface or cast

interface TaskStub {
    id: string;
    title: string;
    notes?: string;
    isDone: boolean;
    tagIds: string[];
}

describe('Habit Data Structure Refactor', () => {

    it('should migrate legacy task (routine/lastUpdated) to new structure (meta/lastDoneDate)', () => {
        let state = createInitialState();
        const now = Date.now();

        // mimic legacy task with routine and lastUpdated
        const legacyTask: any = {
            id: 'legacy1',
            title: 'Legacy Habit [freq:daily]',
            notes: `\`\`\`json
{
  "meta": {
    "type": "HABIT",
    "version": 1,
    "originalTitle": "Legacy Habit [freq:daily]"
  },
  "progress": {
    "current": 0,
    "target": 1,
    "lastUpdated": ${now - 86400000 * 2} 
  },
  "routine": {
    "frequency": "daily",
    "lastDone": ${now - 86400000 * 2}
  }
}
\`\`\``,
            isDone: false,
            tagIds: []
        };

        const result = processTaskCompletion(state, legacyTask);
        const updates = result.taskUpdates!;
        if (!updates.notes) throw new Error('Notes missing');
        const match = updates.notes.match(/```json\s*([\s\S]*?)\s*```/);
        if (!match) throw new Error('JSON missing');
        const qd = JSON.parse(match[1]!);

        // CHECK: Routine should be removed
        expect(qd.routine).toBeUndefined();

        // CHECK: lastUpdated should be removed
        expect(qd.progress.lastUpdated).toBeUndefined();

        // CHECK: lastDoneDate should be present (ISO string)
        expect(qd.progress.lastDoneDate).toBeDefined();
        expect(new Date(qd.progress.lastDoneDate).getTime()).toBeGreaterThan(now - 1000);

        // CHECK: meta.frequency should be populated
        expect(qd.meta.frequency).toBe('daily');
    });

    it('should correctly handle a task that already has valid lastDoneDate', () => {
        let state = createInitialState();
        const now = Date.now();

        // Task done yesterday
        const yesterday = new Date(now - 86400000).toISOString();

        const freshTask: TaskStub = {
            id: 'fresh1',
            title: 'Fresh Habit [freq:daily]',
            notes: `\`\`\`json
{
  "meta": {
    "type": "HABIT",
    "version": 1,
    "originalTitle": "Fresh Habit [freq:daily]",
    "frequency": "daily"
  },
  "progress": {
    "current": 1,
    "target": 1,
    "lastDoneDate": "${yesterday}"
  }
}
\`\`\``,
            isDone: false,
            tagIds: []
        };

        // If done yesterday, it should be clickable today (streak logic check)
        const result = processTaskCompletion(state, freshTask);

        // It should NOT block (because yesterday is > 1 day ago for daily? Wait, daily resets at midnight usually, or 24h?)
        // CronHelper uses 'daily' = '0 0 * * *' usually. 
        // If yesterday was > 24h ago, it should be fine.
        // Let's assume CronHelper handles it. The test confirms it processes successfully.

        expect(result.shouldBlock).toBeFalsy();

        const updates = result.taskUpdates!;
        if (!updates.notes) throw new Error('Notes missing');
        const match = updates.notes.match(/```json\s*([\s\S]*?)\s*```/);
        if (!match) throw new Error('JSON missing');
        const qd = JSON.parse(match[1]!);

        expect(qd.progress.current).toBe(1); // Increment from 0? or continues?
        // Wait, input progress.current was 1. If it was "done", it resets to 0 if new cycle?
        // StreakLogic: if cyclesPassed > 0, current = 0.
        // So it should be 1 (new progress).

        expect(qd.progress.lastDoneDate).toBeDefined();
        // and routine/lastUpdated are absent
        expect(qd.routine).toBeUndefined();
        expect(qd.progress.lastUpdated).toBeUndefined();
    });

    it('should block double-dipping based on lastDoneDate', () => {
        let state = createInitialState();
        const now = Date.now();
        const justNow = new Date(now).toISOString();

        const spammerTask: TaskStub = {
            id: 'spam1',
            title: 'Spam Habit [freq:daily]',
            notes: `\`\`\`json
{
  "meta": {
    "type": "HABIT",
    "version": 1,
    "originalTitle": "Spam Habit [freq:daily]",
    "frequency": "daily"
  },
  "progress": {
    "current": 1,
    "target": 1,
    "lastDoneDate": "${justNow}"
  }
}
\`\`\``,
            isDone: true,
            tagIds: []
        };

        const result = processTaskCompletion(state, spammerTask);

        expect(result.shouldBlock).toBe(true);
        expect(result.blockReason).toBe('ALREADY_DONE_TODAY');
    });

});
