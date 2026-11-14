import { describe, expect, it } from 'vitest';

import { createBrain } from '@questarc/ui/adapter/brain';
import type { State } from '@questarc/ui/shared/protocol';
import { builtInJourneys } from '@questarc/ui/shared/content';
import { createFakeHost, dailyHabit } from '@questarc/ui/testing/fake-host';
import { handleMessage } from '../src/adapter/messages';

const RUN = 'run-1';

/** A started gentle-morning run whose first stage is bound to a daily habit. */
const setUp = () => {
  const fake = createFakeHost();
  const habit = dailyHabit('cfg1', '2026-10-26', []);
  fake.host.repeatCfgs.cfg1 = habit.cfg;
  for (const task of habit.tasks) fake.host.tasks[task.id] = task;
  Object.assign(fake.host.data, {
    [`run:${RUN}`]: JSON.stringify({
      journeyId: 'gentle-morning',
      journeyVersion: 1,
      startDay: '2026-10-26',
    }),
    [`stage:${RUN}:water`]: JSON.stringify({ acceptedDay: '2026-10-26' }),
    [`binding:${RUN}:water`]: JSON.stringify({
      taskId: habit.tasks[0]?.id ?? 'x',
      repeatCfgId: 'cfg1',
      day: '2026-10-26',
    }),
  });
  const brain = createBrain({
    api: fake.api,
    journeys: builtInJourneys,
    debounceMs: 10,
    onEvents: () => undefined,
  });
  return { ...fake, brain };
};

describe('messages from the view', () => {
  it('writes records and answers with a state that includes them', async () => {
    const { brain, host } = setUp();
    await brain.state();
    const state = (await handleMessage(brain, {
      type: 'questarc:write',
      records: { 'pause:run-1:2026-10-27': { action: 'pause', source: 'user' } },
    })) as State;
    expect(host.data['pause:run-1:2026-10-27']).toBe('{"action":"pause","source":"user"}');
    expect(state.view.active?.paused).toBe(true);
    expect(state.records['pause:run-1:2026-10-27']).toEqual({ action: 'pause', source: 'user' });
  });

  it('rejects unknown requests', async () => {
    const { brain } = setUp();
    await expect(handleMessage(brain, { type: 'other' })).rejects.toThrow();
  });
});
