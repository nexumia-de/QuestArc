import { gzipSync } from 'node:zlib';

import { bindStage, startJourney } from '@questarc/engine';
import { createBrain } from '@questarc/ui/adapter/brain';
import { registerHooks } from '@questarc/ui/adapter/hooks';
import { builtInJourneys } from '@questarc/ui/shared/content';
import { describe, expect, it } from 'vitest';

import { createHost } from '../src/host';
import { freshDataset } from '../src/store/dataset';
import { setDone } from '../src/store/habits';
import { memory, openStore } from '../src/store/store';

const journey = builtInJourneys.find((j) => j.id === 'gentle-morning');
if (!journey) throw new Error('no built-in journey');
const stage = journey.stages[0];
if (!stage) throw new Error('no stage');
const DAY = '2026-03-02';

const setup = async () => {
  const kept = memory();
  const store = await openStore(kept, freshDataset);
  const shown: string[] = [];
  let ids = 0;
  const host = createHost({
    store,
    now: () => new Date(`${DAY}T08:00:00Z`),
    showSnack: ({ msg }) => shown.push(msg),
    selectTask: (taskId) => void shown.push(`selected ${taskId}`),
    newId: () => `cfg${(ids += 1)}`,
  });
  return { kept, store, host, shown };
};

describe('the standalone host', () => {
  it('keeps choice records as Super Productivity’s plugin data', async () => {
    const { host, store, kept } = await setup();
    await host.api.persistDataSynced('{"a":1}', 'run:r');
    await host.api.persistDataSynced('{"b":2}', 'binding:r:s');
    await host.api.persistDataSynced('', 'binding:r:s');
    expect(store.data.pluginUserData).toEqual([
      { id: 'questarc:run:r', data: '{"a":1}' },
      { id: 'questarc:binding:r:s', data: '' },
    ]);
    expect(kept.saved).toBe(store.data);
    expect(await host.api.listSyncedDataKeys()).toEqual(['run:r']);
    expect(await host.api.loadSyncedData('run:r')).toBe('{"a":1}');
    expect(await host.api.loadSyncedData('none')).toBeNull();
  });

  it('reads plugin data Super Productivity compressed', async () => {
    const text = JSON.stringify({ why: 'x'.repeat(2000) });
    const kept = memory({
      ...freshDataset(),
      pluginUserData: [{ id: 'questarc:run:r', data: `GZ1:${gzipSync(text).toString('base64')}` }],
    });
    const host = createHost({
      store: await openStore(kept, freshDataset),
      showSnack: () => undefined,
      selectTask: () => undefined,
    });
    expect(await host.api.loadSyncedData('run:r')).toBe(text);
  });

  it('creates the recurring task itself, with the schedule it is given', async () => {
    const { host, store, shown } = await setup();
    const changes: string[] = [];
    host.api.registerHook('dataChanged' as never, () => void changes.push('hook'));
    host.onChange(() => changes.push('listener'));
    const made = await host.view.createHabit?.({
      title: 'Water',
      schedule: { type: 'everyNDays', n: 2 },
    });
    expect(made).toEqual({ taskId: `rpt_cfg1_${DAY}`, repeatCfgId: 'cfg1' });
    const taskId = made?.taskId ?? '';
    expect(store.data.taskRepeatCfg.entities.cfg1).toMatchObject({
      title: 'Water',
      repeatCycle: 'DAILY',
      repeatEvery: 2,
      startDate: DAY,
    });
    expect(changes).toEqual(['hook', 'listener']);
    await host.view.selectTask(taskId);
    expect(shown).toEqual([`selected ${taskId}`]);
  });

  it('runs the plugin’s adapter: a tick moves the journey and gives the message’s events', async () => {
    const { host, store } = await setup();
    const events: string[] = [];
    const brain = createBrain({
      api: host.api,
      journeys: builtInJourneys,
      onEvents: (list) => events.push(...list.map((event) => event.key)),
      debounceMs: 0,
    });
    registerHooks(host.api, brain.refresh);
    await brain.write(startJourney({ runId: 'r', journey, startDay: DAY }));
    const { taskId, repeatCfgId } =
      (await host.view.createHabit?.({ title: 'Water', schedule: stage.schedule })) ?? {};
    const bound = await brain.write(
      bindStage({ runId: 'r', stageId: stage.id, taskId: taskId ?? '', repeatCfgId, day: DAY }),
    );
    expect(bound.view.active?.stations[0]?.state).not.toBe('unbound');
    expect(bound.view.active?.stations[0]?.progress).toBe(0);

    await store.update((data) => setDone(data, taskId ?? '', true, Date.parse(`${DAY}T08:00:00Z`)));
    host.emit('dataChanged');
    const ticked = await brain.state();
    expect(ticked.view.active?.stations[0]?.progress).toBeGreaterThan(0);
    expect(events.length).toBeGreaterThan(0);
    brain.stop();
  });
});
