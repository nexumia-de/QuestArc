import type {
  DayContext,
  Journey,
  Snapshot,
  SnapshotRepeatCfg,
  SnapshotTask,
} from '@questarc/engine';
import type { PluginTaskRepeatCfg, Task } from '@questarc/sp-plugin-api';

import type { Records } from './records';

/**
 * Builds the engine's input from Super Productivity's data
 * (docs/data-model.md §1). Super Productivity passes more fields at
 * runtime than the plugin types declare (wontDoOn, deletedInstanceDates,
 * …); they are read here.
 */

type RuntimeTask = Task & { wontDoOn?: number | null; created?: number };
type RuntimeRepeatCfg = PluginTaskRepeatCfg & {
  repeatUntilDay?: string;
  deletedInstanceDates?: string[];
  repeatFromCompletionDate?: boolean;
  waitForCompletion?: boolean;
};

export const toTask = (task: Task): SnapshotTask => {
  const t = task as RuntimeTask;
  return {
    id: t.id,
    isDone: t.isDone,
    doneOn: t.doneOn ?? null,
    wontDoOn: t.wontDoOn ?? null,
    dueDay: t.dueDay ?? null,
    ...(typeof t.created === 'number' ? { created: t.created } : {}),
    repeatCfgId: t.repeatCfgId ?? null,
    timeSpentOnDay: t.timeSpentOnDay ?? {},
  };
};

export const toRepeatCfg = (cfg: PluginTaskRepeatCfg): SnapshotRepeatCfg => {
  const c = cfg as RuntimeRepeatCfg;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return {
    id: c.id,
    isPaused: c.isPaused,
    repeatCycle: c.repeatCycle,
    repeatEvery: c.repeatEvery,
    ...(c.startDate ? { startDate: c.startDate } : {}),
    ...(c.repeatUntilDay ? { repeatUntilDay: c.repeatUntilDay } : {}),
    ...Object.fromEntries(days.map((d) => [d, Boolean(c[d as keyof RuntimeRepeatCfg])])),
    ...(c.deletedInstanceDates ? { deletedInstanceDates: [...c.deletedInstanceDates] } : {}),
    ...(c.repeatFromCompletionDate ? { repeatFromCompletionDate: true } : {}),
    ...(c.waitForCompletion ? { waitForCompletion: true } : {}),
  };
};

/**
 * The tasks and repeat configs the bindings point to (data model: hosts
 * may filter). A stage's tasks are found by the bound task id and by the
 * repeat config of the binding or of the bound task, as the engine does.
 */
export const relevantIds = (
  records: Records,
  tasks: readonly SnapshotTask[],
): { taskIds: Set<string>; cfgIds: Set<string> } => {
  const taskIds = new Set<string>();
  const cfgIds = new Set<string>();
  for (const [key, value] of Object.entries(records)) {
    if (!key.startsWith('binding:') || typeof value !== 'object' || value === null) continue;
    const { taskId, repeatCfgId } = value as { taskId?: unknown; repeatCfgId?: unknown };
    if (typeof taskId === 'string') taskIds.add(taskId);
    if (typeof repeatCfgId === 'string' && repeatCfgId) cfgIds.add(repeatCfgId);
  }
  for (const task of tasks)
    if (taskIds.has(task.id) && task.repeatCfgId) cfgIds.add(task.repeatCfgId);
  return { taskIds, cfgIds };
};

export const isRelevant = (
  task: SnapshotTask,
  ids: { taskIds: Set<string>; cfgIds: Set<string> },
): boolean => ids.taskIds.has(task.id) || (!!task.repeatCfgId && ids.cfgIds.has(task.repeatCfgId));

export interface SnapshotInput {
  readonly day: DayContext;
  readonly live: readonly SnapshotTask[];
  readonly archived: readonly SnapshotTask[];
  readonly repeatCfgs: readonly SnapshotRepeatCfg[];
  readonly records: Records;
  readonly journeys: readonly Journey[];
}

/** Live tasks win over archived ones with the same id. */
export const buildSnapshot = (input: SnapshotInput): Snapshot => {
  const all = new Map<string, SnapshotTask>();
  for (const task of input.archived) all.set(task.id, task);
  for (const task of input.live) all.set(task.id, task);
  const ids = relevantIds(input.records, [...all.values()]);
  return {
    day: input.day,
    tasks: [...all.values()].filter((task) => isRelevant(task, ids)),
    repeatCfgs: input.repeatCfgs.filter((cfg) => ids.cfgIds.has(cfg.id)),
    choices: input.records,
    journeys: input.journeys,
  };
};
