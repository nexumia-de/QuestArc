import { describe, expect, it, vi } from 'vitest';

import { createBrain } from '../src/adapter/brain';
import { registerHooks } from '../src/adapter/hooks';
import { artPack, handleMessage } from '../src/adapter/messages';
import type { State } from '../src/shared/protocol';
import { messageFor } from '../src/adapter/snacks';
import { builtInJourneys } from '../src/shared/content';
import { createFakeHost, dailyHabit, noon } from './fake-host';

const RUN = 'run-1';

/** A started gentle-morning run whose first stage is bound to a daily habit. */
const setUp = (doneDays: readonly string[], options: Parameters<typeof createFakeHost>[0] = {}) => {
  const fake = createFakeHost(options);
  const habit = dailyHabit('cfg1', '2026-10-26', doneDays);
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
  const messages: string[] = [];
  const brain = createBrain({
    api: fake.api,
    journeys: builtInJourneys,
    debounceMs: 10,
    onEvents: (events, view, journeys) => {
      const msg = messageFor(events, view, journeys);
      if (msg) messages.push(msg);
    },
  });
  return { ...fake, brain, messages };
};

const complete = (host: ReturnType<typeof createFakeHost>['host'], day: string) => {
  host.tasks[`rpt_cfg1_${day}`] = {
    id: `rpt_cfg1_${day}`,
    isDone: true,
    doneOn: noon(day),
    repeatCfgId: 'cfg1',
    created: noon(day),
    dueDay: day,
  };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

describe('brain', () => {
  it('keeps records it does not understand through a write', async () => {
    const { brain, host } = setUp(['2026-10-26']);
    host.data['note:run-1:water'] = JSON.stringify({ text: 'from a newer QuestArc' });
    const before = { ...host.data };
    const { view } = await brain.write({
      'pause:run-1:2026-10-27': { action: 'pause', source: 'user' },
    });
    expect(view.active?.paused).toBe(true);
    expect(view.problems).toEqual([]);
    expect(host.data['note:run-1:water']).toBe(before['note:run-1:water']);
    await brain.write({ 'note:run-1:water': '' });
    expect(host.data['note:run-1:water']).toBe(before['note:run-1:water']);
  });

  it('shows a run written by a newer QuestArc as read-only and writes nothing for it', async () => {
    const { brain, host } = setUp(['2026-10-26']);
    host.data[`graduation:${RUN}:water`] = JSON.stringify({ dataFormat: 3, choice: 'keep' });
    const before = { ...host.data };
    const { view } = await brain.state();
    expect(view.active).toBeUndefined();
    expect(view.readOnly).toEqual([
      { runId: RUN, journeyId: 'gentle-morning', reason: 'newer-format', state: 'active' },
    ]);
    await brain.write({ [`pause:${RUN}:2026-11-02`]: { action: 'pause', source: 'user' } });
    await brain.write({ [`run-end:${RUN}`]: { day: '2026-11-02', reason: 'abandoned' } });
    expect(host.data).toEqual(before);
  });

  it('derives the game from the plugin API', async () => {
    const { brain } = setUp(['2026-10-26', '2026-10-27', '2026-10-28']);
    const { view } = await brain.state();
    expect(view.active?.journeyId).toBe('gentle-morning');
    expect(view.active?.stations[0]?.completions).toBe(3);
    expect(view.problems).toEqual([]);
  });

  it('shows one message after a completion, but not for the first evaluation', async () => {
    const { brain, host, messages } = setUp(['2026-10-26', '2026-10-27']);
    await brain.state();
    expect(messages).toEqual([]);
    // 10-26 has left the window of the last 7 due days (10-27 … 11-02).
    complete(host, '2026-10-28');
    brain.refresh('tasks');
    await settle();
    expect(messages).toEqual(['Drink a glass of water: done. 2 of 5 days.']);
  });

  it('reads nothing and shows nothing after it is stopped', async () => {
    const { brain, host, api, messages } = setUp(['2026-10-26']);
    await brain.state();
    const read = vi.spyOn(api, 'getAppState');
    complete(host, '2026-10-28');
    brain.refresh('tasks');
    brain.stop();
    brain.refresh('tasks');
    await settle();
    expect(read).not.toHaveBeenCalled();
    expect(messages).toEqual([]);
  });

  it('coalesces refreshes while time tracking fires dataChanged', async () => {
    const { brain, api } = setUp([]);
    await brain.state();
    const read = vi.spyOn(api, 'getAppState');
    for (let i = 0; i < 5; i += 1) brain.refresh('tasks');
    await settle();
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('reads the archive once and again only when a bound task leaves the live list', async () => {
    const { brain, host } = setUp(['2026-10-26', '2026-10-27']);
    await brain.state();
    brain.refresh('tasks');
    await settle();
    expect(host.reads.archive).toBe(1);

    // "Finish day" moves the done instances to the archive.
    const moved = Object.values(host.tasks);
    host.archive.push(...moved.map((task) => ({ ...task, dueDay: null })));
    host.tasks = {};
    brain.refresh('tasks');
    await settle();
    expect(host.reads.archive).toBe(2);
    expect((await brain.state()).view.active?.stations[0]?.completions).toBe(2);
  });

  it('keeps choice records cached until persistedDataChanged', async () => {
    const { brain, host } = setUp([]);
    await brain.state();
    await brain.state();
    expect(host.reads.keys).toBe(1);
    host.data['pause:run-1:2026-10-27'] = JSON.stringify({ action: 'pause', source: 'user' });
    brain.refresh('records');
    await settle();
    expect(host.reads.keys).toBe(2);
    expect((await brain.state()).view.active?.paused).toBe(true);
  });

  it('writes records and answers with a state that includes them', async () => {
    const { brain, host } = setUp([]);
    await brain.state();
    const state = (await handleMessage(brain, {
      type: 'questarc:write',
      records: { 'pause:run-1:2026-10-27': { action: 'pause', source: 'user' } },
    })) as State;
    expect(host.data['pause:run-1:2026-10-27']).toBe('{"action":"pause","source":"user"}');
    expect(state.view.active?.paused).toBe(true);
    expect(state.records['pause:run-1:2026-10-27']).toEqual({ action: 'pause', source: 'user' });
  });

  it('withdraws a record by writing an empty string', async () => {
    const { brain, host } = setUp(['2026-10-26']);
    const state = await brain.write({ [`run:${RUN}`]: '' });
    expect(host.data[`run:${RUN}`]).toBe('');
    expect(state.view.active).toBeUndefined();
  });

  it('rejects unknown requests', async () => {
    const { brain } = setUp([]);
    await expect(handleMessage(brain, { type: 'other' })).rejects.toThrow();
  });

  it('falls back to the local date without getDayContext', async () => {
    const { brain } = setUp([], { dayContext: false });
    const { view } = await brain.state();
    expect(view.todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('hooks', () => {
  it('registers every hook the host knows and skips the others', () => {
    const { api, host } = createFakeHost({
      hooks: ['persistedDataChanged', 'taskComplete', 'taskUpdate'],
    });
    const accepted = registerHooks(api, () => undefined);
    expect(accepted).toEqual(['persistedDataChanged', 'taskComplete', 'taskUpdate']);
    expect([...host.hooks.keys()]).toEqual(accepted);
  });

  it('refreshes with what each hook invalidates', () => {
    const { api, host } = createFakeHost();
    const refresh = vi.fn();
    registerHooks(api, refresh);
    host.hooks.get('persistedDataChanged')?.();
    host.hooks.get('dayChange')?.();
    host.hooks.get('dataChanged')?.();
    expect(refresh.mock.calls).toEqual([['records'], ['archive'], ['tasks']]);
  });
});

describe('repeat paused in Super Productivity', () => {
  it('writes a pause record when the bound repeat is paused, and a resume record after', async () => {
    const { brain, host } = setUp(['2026-10-31', '2026-11-01']);
    await brain.state();
    (host.repeatCfgs.cfg1 as { isPaused: boolean }).isPaused = true;
    brain.refresh('tasks');
    await settle();
    expect(JSON.parse(host.data[`pause:${RUN}:2026-11-02`] ?? '')).toEqual({
      action: 'pause',
      source: 'repeat-cfg',
    });
    expect((await brain.state()).view.active?.paused).toBe(true);

    host.today = '2026-11-04';
    (host.repeatCfgs.cfg1 as { isPaused: boolean }).isPaused = false;
    brain.refresh('tasks');
    await settle();
    expect(JSON.parse(host.data[`pause:${RUN}:2026-11-04`] ?? '')).toEqual({
      action: 'resume',
      source: 'repeat-cfg',
    });
    const station = (await brain.state()).view.active?.stations[0];
    // 11-02 and 11-03 were paused, not missed.
    expect(station?.lastDays?.filter((d) => d.mark === 'paused').map((d) => d.day)).toEqual([
      '2026-11-02',
      '2026-11-03',
    ]);
  });

  it('only remembers the state on the first look', async () => {
    const { brain, host } = setUp(['2026-11-01']);
    (host.repeatCfgs.cfg1 as { isPaused: boolean }).isPaused = true;
    await brain.state();
    expect(Object.keys(host.data).some((key) => key.startsWith('pause:'))).toBe(false);
  });
});

describe('the pictures for the view (#100)', () => {
  it('are sent once on request, only the ladders’ pictures', async () => {
    const { brain } = setUp([]);
    const pack = await handleMessage(brain, { type: 'questarc:art' });
    expect(pack).toBe(artPack);
    expect(Object.keys(artPack.ladders).sort()).toEqual(['crossing', 'home']);
    expect(artPack.pictures['build-home-3']).toContain('<svg');
    expect(artPack.pictures['keepsake-first-step']).toBeUndefined();
  });
});
