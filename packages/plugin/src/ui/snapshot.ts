import type { Snapshot, SnapshotRepeatCfg, SnapshotTask } from '@questarc/engine';
import type { PluginTaskRepeatCfg, Task } from '@questarc/sp-plugin-api';

/**
 * Collects the engine's input through the plugin API (docs/data-model.md
 * §1). Super Productivity passes more fields at runtime than the plugin
 * types declare (wontDoOn, deletedInstanceDates, …); they are read here.
 * The full adapter with recompute on hooks follows in issue #28.
 */

type RuntimeTask = Task & { wontDoOn?: number | null; created?: number };
type RuntimeRepeatCfg = PluginTaskRepeatCfg & {
  repeatUntilDay?: string;
  deletedInstanceDates?: string[];
  repeatFromCompletionDate?: boolean;
  waitForCompletion?: boolean;
};

const toTask = (task: RuntimeTask): SnapshotTask => ({
  id: task.id,
  isDone: task.isDone,
  doneOn: task.doneOn ?? null,
  wontDoOn: task.wontDoOn ?? null,
  dueDay: task.dueDay ?? null,
  ...(typeof task.created === 'number' ? { created: task.created } : {}),
  repeatCfgId: task.repeatCfgId ?? null,
  timeSpentOnDay: task.timeSpentOnDay,
});

const toRepeatCfg = (cfg: RuntimeRepeatCfg): SnapshotRepeatCfg => ({ ...cfg });

/** Local calendar day as YYYY-MM-DD, used where getDayContext() is missing. */
const localDay = (date: Date): string =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, '0'))
    .join('-');

const loadChoices = async (): Promise<Record<string, unknown>> => {
  const keys = await PluginAPI.listSyncedDataKeys();
  const entries = await Promise.all(
    keys.map(async (key) => {
      const raw = await PluginAPI.loadSyncedData(key);
      try {
        return [key, raw ? (JSON.parse(raw) as unknown) : ''] as const;
      } catch {
        return [key, ''] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
};

export const loadSnapshot = async (): Promise<Snapshot> => {
  const [state, archived, choices] = await Promise.all([
    PluginAPI.getAppState(),
    PluginAPI.getArchivedTasks(),
    loadChoices(),
  ]);
  // getDayContext() exists only after Super Productivity 19.3.1.
  const day = PluginAPI.getDayContext ? await PluginAPI.getDayContext() : null;
  return {
    day: {
      todayStr: day?.todayStr ?? localDay(new Date()),
      startOfNextDayDiffMs: day?.startOfNextDayDiffMs ?? 0,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    tasks: [...Object.values(state.tasks), ...archived].map((t) => toTask(t as RuntimeTask)),
    repeatCfgs: Object.values(state.taskRepeatCfgs).map((c) => toRepeatCfg(c as RuntimeRepeatCfg)),
    choices,
    journeys: [],
  };
};
