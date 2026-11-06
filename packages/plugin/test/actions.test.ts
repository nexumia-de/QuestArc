import { evaluate } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import { useForCurrentStation } from '../src/adapter/context-menu';
import { createBrain } from '../src/adapter/brain';
import { bindStage, continueJourney, newRunId, startJourney } from '../src/shared/actions';
import { builtInJourneys } from '../src/shared/content';
import { createFakeHost } from './fake-host';

const journey = builtInJourneys.find((j) => j.id === 'gentle-morning');
if (!journey) throw new Error('no built-in journey');
const day = { todayStr: '2026-11-10', startOfNextDayDiffMs: 0, timeZone: 'UTC' };

describe('records written by user actions', () => {
  it('starting a journey writes the run with the reason and accepts the first stage', () => {
    expect(
      startJourney({ runId: 'r', journey, startDay: '2026-11-09', why: '  calm mornings ' }),
    ).toEqual({
      'run:r': {
        journeyId: 'gentle-morning',
        journeyVersion: 1,
        startDay: '2026-11-09',
        why: 'calm mornings',
      },
      'stage:r:water': { acceptedDay: '2026-11-09' },
    });
  });

  it('leaves out an empty reason', () => {
    expect(
      startJourney({ runId: 'r', journey, startDay: '2026-11-09', why: '  ' })['run:r'],
    ).not.toHaveProperty('why');
  });

  it('makes run ids of 32 hex digits', () => {
    expect(newRunId()).toMatch(/^[0-9a-f]{32}$/);
    expect(newRunId()).not.toBe(newRunId());
  });

  it('continuing writes the checkpoint and accepts the next stage, or ends the journey', () => {
    const tasks = ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'].map(
      (d) => ({
        id: `rpt_c_${d}`,
        isDone: true,
        doneOn: Date.parse(`${d}T07:00:00Z`),
        repeatCfgId: 'c',
        created: Date.parse(`${d}T12:00:00Z`),
      }),
    );
    const base = {
      day,
      tasks,
      repeatCfgs: [{ id: 'c', isPaused: false, repeatCycle: 'DAILY' as const, repeatEvery: 1 }],
      journeys: builtInJourneys,
    };
    const first = evaluate({
      ...base,
      choices: {
        'run:r': { journeyId: 'gentle-morning', journeyVersion: 1, startDay: '2026-11-04' },
        'stage:r:water': { acceptedDay: '2026-11-04' },
        ...bindStage({
          runId: 'r',
          stageId: 'water',
          taskId: 'rpt_c_2026-11-04',
          repeatCfgId: 'c',
          day: '2026-11-04',
        }),
      },
    });
    const run = first.active;
    if (!run) throw new Error('no run');
    expect(run.stations[0]?.state).toBe('met');
    expect(continueJourney(run, journey, '2026-11-10')).toEqual({
      'stage-done:r:water': { day: '2026-11-10', xp: 50, damage: 0 },
      'stage:r:stretch-1': { acceptedDay: '2026-11-10' },
    });

    const last = journey.stages.at(-1);
    const done = Object.fromEntries(
      journey.stages
        .slice(0, -1)
        .map((s) => [`stage-done:r:${s.id}`, { day: '2026-11-03', xp: 50, damage: 0 }]),
    );
    const atEnd = evaluate({
      ...base,
      choices: {
        'run:r': { journeyId: 'gentle-morning', journeyVersion: 1, startDay: '2026-10-01' },
        ...done,
        [`stage:r:${last?.id}`]: { acceptedDay: '2026-11-04' },
        ...bindStage({
          runId: 'r',
          stageId: last?.id ?? '',
          taskId: 'rpt_c_2026-11-04',
          repeatCfgId: 'c',
          day: '2026-11-04',
        }),
      },
    });
    // The last stage needs 8 of 10 days: not met yet, so nothing is written.
    expect(atEnd.active && continueJourney(atEnd.active, journey, '2026-11-10')).toEqual({});
  });
});

describe('task context menu', () => {
  it('binds the chosen task to the current stage', async () => {
    const { api, host } = createFakeHost();
    host.today = '2026-11-10';
    host.tasks.t1 = { id: 't1', isDone: false, repeatCfgId: 'c1' };
    host.repeatCfgs.c1 = { id: 'c1', isPaused: false, repeatCycle: 'DAILY', repeatEvery: 1 };
    Object.assign(host.data, {
      'run:r': JSON.stringify({
        journeyId: 'gentle-morning',
        journeyVersion: 1,
        startDay: '2026-11-10',
      }),
      'stage:r:water': JSON.stringify({ acceptedDay: '2026-11-10' }),
    });
    const brain = createBrain({ api, journeys: builtInJourneys, onEvents: () => undefined });
    const msg = await useForCurrentStation(api, brain, 't1');
    expect(msg).toBe('QuestArc follows this task for "Drink a glass of water".');
    expect(JSON.parse(host.data['binding:r:water'] ?? '')).toEqual({
      taskId: 't1',
      repeatCfgId: 'c1',
      day: '2026-11-10',
    });
    expect((await brain.state()).view.active?.stations[0]?.state).toBe('current');
  });

  it('says so when no journey runs', async () => {
    const { api } = createFakeHost();
    const brain = createBrain({ api, journeys: builtInJourneys, onEvents: () => undefined });
    expect(await useForCurrentStation(api, brain, 't1')).toBe('Start a journey in QuestArc first.');
  });
});
