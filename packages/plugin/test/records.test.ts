import { describe, expect, it } from 'vitest';

import { loadRecords } from '../src/adapter/records';
import { buildSnapshot } from '@questarc/engine';
import { createFakeHost } from './fake-host';

describe('choice records', () => {
  it('parses JSON values and passes malformed ones on as text', async () => {
    const { api, host } = createFakeHost();
    host.data = { settings: '{"mode":"rpg"}', broken: 'not json', gone: '' };
    expect(await loadRecords(api)).toEqual({ settings: { mode: 'rpg' }, broken: 'not json' });
  });
});

describe('snapshot', () => {
  const day = { todayStr: '2026-11-02', startOfNextDayDiffMs: 0, timeZone: 'UTC' };
  const task = (id: string, repeatCfgId: string | null) => ({ id, isDone: false, repeatCfgId });
  const cfg = (id: string) => ({
    id,
    isPaused: false,
    repeatCycle: 'DAILY' as const,
    repeatEvery: 1,
  });

  it('keeps only bound tasks and repeat configs', () => {
    const snapshot = buildSnapshot({
      day,
      live: [
        task('bound', 'c1'),
        task('rpt_c1_2026-11-01', 'c1'),
        task('other', 'c2'),
        task('plain', null),
      ],
      archived: [task('rpt_c1_2026-10-01', 'c1')],
      repeatCfgs: [cfg('c1'), cfg('c2')],
      records: { 'binding:r:s': { taskId: 'bound', repeatCfgId: 'c1' } },
      journeys: [],
    });
    expect(snapshot.tasks.map((t) => t.id).sort()).toEqual([
      'bound',
      'rpt_c1_2026-10-01',
      'rpt_c1_2026-11-01',
    ]);
    expect(snapshot.repeatCfgs.map((c) => c.id)).toEqual(['c1']);
  });

  it("follows the bound task's repeat config when the binding was written before the repeat", () => {
    const snapshot = buildSnapshot({
      day,
      live: [task('bound', 'c3')],
      archived: [],
      repeatCfgs: [cfg('c3')],
      records: { 'binding:r:s': { taskId: 'bound' } },
      journeys: [],
    });
    expect(snapshot.repeatCfgs.map((c) => c.id)).toEqual(['c3']);
  });
});
