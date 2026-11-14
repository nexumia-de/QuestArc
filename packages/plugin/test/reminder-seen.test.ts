import { toRepeatCfg, type GameView, type ReminderView } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import { reminderSeenChanges } from '../src/adapter/reminder-seen';

// What the host records of a task's reminder (game rules §9): the data
// carries no date for it, so the day it came or went is written.
const view = (active?: ReminderView, habit?: ReminderView): GameView =>
  ({
    todayStr: '2026-11-14',
    ...(active
      ? {
          active: {
            runId: 'r2',
            position: { stage: 0 },
            stations: [{ stageId: 'a' }],
            reminder: active,
          },
        }
      : {}),
    finished: habit ? [{ runId: 'r1', habit: { stageId: 'c', reminder: habit } }] : [],
  }) as unknown as GameView;

describe('what the host saw of a reminder', () => {
  it('records a reminder it sees for the first time, for the growing step and a habit', () => {
    expect(reminderSeenChanges(view({ set: true }, { set: true }), {})).toEqual({
      'reminder-seen:r2:a': { on: true, day: '2026-11-14' },
      'reminder-seen:r1:c': { on: true, day: '2026-11-14' },
    });
  });

  it('records the day a reminder it knew went off', () => {
    expect(
      reminderSeenChanges(view({ set: false }), {
        'reminder-seen:r2:a': { on: true, day: '2026-10-01' },
      }),
    ).toEqual({ 'reminder-seen:r2:a': { on: false, day: '2026-11-14' } });
  });

  it('writes nothing while what it sees is what is recorded', () => {
    // Never set: no record at all, so the reminder counts as never set.
    expect(reminderSeenChanges(view({ set: false }, { set: false }), {})).toEqual({});
    expect(
      reminderSeenChanges(view({ set: true }, { set: false }), {
        'reminder-seen:r2:a': { on: true, day: '2026-10-01' },
        'reminder-seen:r1:c': { on: false, day: '2026-10-20' },
      }),
    ).toEqual({});
    // A stage that is not followed has no reminder to speak of.
    expect(reminderSeenChanges(view(), {})).toEqual({});
  });

  it('records a reminder that came back', () => {
    expect(
      reminderSeenChanges(view(undefined, { set: true }), {
        'reminder-seen:r1:c': { on: false, day: '2026-10-20' },
      }),
    ).toEqual({ 'reminder-seen:r1:c': { on: true, day: '2026-11-14' } });
  });
});

describe('the repeat config the engine gets', () => {
  it("carries Super Productivity's start time and reminder option as they are", () => {
    const cfg = { id: 'c', repeatCycle: 'DAILY', repeatEvery: 1 } as const;
    expect(toRepeatCfg({ ...cfg, startTime: '7:00', remindAt: 'AtStart' })).toMatchObject({
      startTime: '7:00',
      remindAt: 'AtStart',
    });
    const plain = toRepeatCfg({ ...cfg, startTime: null });
    expect('startTime' in plain || 'remindAt' in plain).toBe(false);
  });
});
