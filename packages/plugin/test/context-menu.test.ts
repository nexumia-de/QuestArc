import { describe, expect, it } from 'vitest';

import { createBrain } from '@questarc/ui/adapter/brain';
import { builtInJourneys } from '@questarc/ui/shared/content';
import { createFakeHost } from '@questarc/ui/testing/fake-host';
import { useForCurrentStation } from '../src/adapter/context-menu';

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
