import type { Hooks } from '@super-productivity/plugin-api';

import type { HostApi } from '../src/adapter/host';

/**
 * An in-memory stand-in for Super Productivity's plugin API: tasks, repeat
 * configs, the archive and plugin data, plus counters of what was read.
 */
export interface FakeTask {
  id: string;
  isDone: boolean;
  doneOn?: number | null;
  repeatCfgId?: string | null;
  created?: number;
  dueDay?: string | null;
  timeSpentOnDay?: Record<string, number>;
}

export const createFakeHost = (
  options: { hooks?: readonly string[]; dayContext?: boolean } = {},
) => {
  const known = new Set(
    options.hooks ?? [
      'dataChanged',
      'dayChange',
      'persistedDataChanged',
      'finishDay',
      'taskComplete',
      'taskUpdate',
      'taskDelete',
      'anyTaskUpdate',
    ],
  );
  const host = {
    tasks: {} as Record<string, FakeTask>,
    archive: [] as FakeTask[],
    repeatCfgs: {} as Record<string, Record<string, unknown>>,
    data: {} as Record<string, string>,
    today: '2026-11-02',
    snacks: [] as string[],
    hooks: new Map<string, () => void>(),
    reads: { archive: 0, keys: 0 },
  };
  const api: HostApi = {
    getAppState: async () =>
      ({
        tasks: structuredClone(host.tasks),
        taskRepeatCfgs: structuredClone(host.repeatCfgs),
      }) as never,
    getArchivedTasks: async () => {
      host.reads.archive += 1;
      return structuredClone(host.archive) as never;
    },
    listSyncedDataKeys: async () => {
      host.reads.keys += 1;
      return Object.keys(host.data)
        .filter((key) => host.data[key] !== '')
        .sort();
    },
    loadSyncedData: async (key?: string) => host.data[key ?? ''] ?? null,
    persistDataSynced: async (value: string, key?: string) => {
      host.data[key ?? ''] = value;
    },
    showSnack: (cfg) => {
      host.snacks.push(cfg.msg);
    },
    registerHook: (hook: Hooks, handler: (payload: never) => void) => {
      if (!known.has(hook)) throw new Error(`unknown hook ${hook}`);
      host.hooks.set(hook, () => handler(undefined as never));
    },
    ...(options.dayContext === false
      ? {}
      : { getDayContext: async () => ({ todayStr: host.today, startOfNextDayDiffMs: 0 }) }),
  };
  return { host, api };
};

/** Noon UTC of a day, in ms: a completion that clearly belongs to that day in UTC. */
export const noon = (day: string): number => Date.parse(`${day}T12:00:00Z`);

/** A daily repeat config and its instance tasks done on the given days. */
export const dailyHabit = (cfgId: string, startDate: string, doneDays: readonly string[]) => ({
  cfg: { id: cfgId, isPaused: false, repeatCycle: 'DAILY', repeatEvery: 1, startDate },
  tasks: doneDays.map((day): FakeTask => ({
    id: `rpt_${cfgId}_${day}`,
    isDone: true,
    doneOn: noon(day),
    repeatCfgId: cfgId,
    created: noon(day),
    dueDay: day,
  })),
});
