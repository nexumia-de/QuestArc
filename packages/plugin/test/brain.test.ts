import { stepBack } from '@questarc/engine';
import { describe, expect, it, vi } from 'vitest';

import { createBrain } from '../src/adapter/brain';
import { registerHooks } from '../src/adapter/hooks';
import { handleMessage } from '../src/adapter/messages';
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
    host.data[`graduation:${RUN}:water`] = JSON.stringify({ dataFormat: 5, choice: 'keep' });
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

  it('offers the card after a long break and starts smaller with the earlier task (#82)', async () => {
    const { brain, host, messages } = setUp([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
    ]);
    const larger = dailyHabit('cfg2', '2026-10-30', ['2026-10-31', '2026-11-01']);
    host.repeatCfgs.cfg2 = larger.cfg;
    for (const task of larger.tasks) host.tasks[task.id] = task;
    Object.assign(host.data, {
      [`stage-done:${RUN}:water`]: JSON.stringify({ day: '2026-10-30', dataFormat: 2 }),
      [`stage:${RUN}:stretch-1`]: JSON.stringify({ acceptedDay: '2026-10-30' }),
      [`binding:${RUN}:stretch-1`]: JSON.stringify({
        taskId: larger.tasks[0]?.id,
        repeatCfgId: 'cfg2',
        day: '2026-10-30',
      }),
    });
    host.today = '2026-11-14';
    expect((await brain.state()).view.active?.comeBack).toBeUndefined();
    host.today = '2026-11-15';
    brain.refresh('tasks');
    await settle();
    const before = (await brain.state()).view.active;
    expect(before?.comeBack).toEqual({ from: '2026-11-02', smaller: 'water' });
    if (!before) return;

    const { view } = await brain.write(stepBack(before, '2026-11-15', { pause: true }));
    expect(host.data[`step-back:${RUN}:stretch-1:2026-11-15`]).toBe('{"dataFormat":4}');
    expect(view.active?.position.stage).toBe(0);
    expect(view.active?.stations[0]?.state).toBe('current');
    expect(view.active?.comeBack).toBeUndefined();
    expect(view.active?.build.version).toBe(2);
    expect(view.problems).toEqual([]);

    complete(host, '2026-11-15');
    brain.refresh('tasks');
    await settle();
    expect(messages).toEqual(['Welcome back. Your run goes on.']);
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

  it('records a reminder it sees on the task, also when the host reports its own write at once', async () => {
    const { brain, host, api } = setUp(['2026-11-01']);
    registerHooks(api, brain.refresh);
    // Super Productivity fires persistedDataChanged for a plugin's own writes too.
    const persist = api.persistDataSynced;
    api.persistDataSynced = async (value, key) => {
      await persist(value, key);
      host.hooks.get('persistedDataChanged')?.();
    };
    Object.assign(host.repeatCfgs.cfg1 as object, { startTime: '7:00', remindAt: 'AtStart' });
    const state = await brain.state();
    expect(JSON.parse(host.data[`reminder-seen:${RUN}:water`] ?? '')).toEqual({
      on: true,
      day: '2026-11-02',
    });
    // The evaluation went on with every record, not only the one it wrote.
    expect(state.view.active?.runId).toBe(RUN);
    expect(state.view.active?.reminder).toEqual({ set: true, time: '7:00' });
    expect(Object.keys(state.records)).toContain(`run:${RUN}`);

    host.today = '2026-11-05';
    Object.assign(host.repeatCfgs.cfg1 as object, { remindAt: 'DoNotRemind' });
    brain.refresh('tasks');
    await settle();
    expect(JSON.parse(host.data[`reminder-seen:${RUN}:water`] ?? '')).toEqual({
      on: false,
      day: '2026-11-05',
    });
    expect((await brain.state()).view.active?.reminder).toEqual({ set: false });
  });
});
