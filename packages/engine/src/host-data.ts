import type { Journey } from './types/journey';
import type { DayContext, Snapshot, SnapshotRepeatCfg, SnapshotTask } from './types/snapshot';

/**
 * Builds the engine's input from Super Productivity's task and repeat
 * objects as they are (docs/data-model.md §1), for both hosts: the
 * plugin passes what its API returns, Pensum what its backup file holds
 * (engine-cli.mjs `{ "evaluateHost": … }`). Only the fields read here
 * matter; everything else is ignored.
 */

export type Records = Readonly<Record<string, unknown>>;

/** A task as Super Productivity stores it (the fields the engine reads). */
export interface HostTask {
  readonly id: string;
  readonly isDone: boolean;
  readonly doneOn?: number | null;
  readonly wontDoOn?: number | null;
  readonly dueDay?: string | null;
  readonly created?: number;
  readonly repeatCfgId?: string | null;
  readonly timeSpentOnDay?: Readonly<Record<string, number>>;
}

/** A repeat config as Super Productivity stores it (the fields read). */
export interface HostRepeatCfg {
  readonly id: string;
  readonly isPaused?: boolean;
  readonly repeatCycle: SnapshotRepeatCfg['repeatCycle'];
  readonly repeatEvery: number;
  readonly startDate?: string | null;
  readonly startTime?: string | null;
  readonly remindAt?: string | null;
  readonly repeatUntilDay?: string | null;
  readonly deletedInstanceDates?: readonly string[];
  readonly repeatFromCompletionDate?: boolean;
  readonly waitForCompletion?: boolean;
  readonly [weekday: string]: unknown;
}

export const toTask = (t: HostTask): SnapshotTask => {
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

export const toRepeatCfg = (c: HostRepeatCfg): SnapshotRepeatCfg => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return {
    id: c.id,
    isPaused: c.isPaused,
    repeatCycle: c.repeatCycle,
    repeatEvery: c.repeatEvery,
    ...(c.startDate ? { startDate: c.startDate } : {}),
    ...(c.startTime ? { startTime: c.startTime } : {}),
    ...(c.remindAt ? { remindAt: c.remindAt } : {}),
    ...(c.repeatUntilDay ? { repeatUntilDay: c.repeatUntilDay } : {}),
    ...Object.fromEntries(days.map((d) => [d, Boolean(c[d])])),
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

/** The same input with Super Productivity's raw objects, for hosts that hold them. */
export interface HostInput {
  readonly day: DayContext;
  readonly live: readonly HostTask[];
  readonly archived: readonly HostTask[];
  readonly repeatCfgs: readonly HostRepeatCfg[];
  readonly records: Records;
  readonly journeys: readonly Journey[];
}

/**
 * Only tasks the bindings point to can count (data model: hosts may
 * filter), and nearly all of an archive is unrelated, so the raw archived
 * tasks are filtered before any is converted: a pass that reads only `id`
 * and `repeatCfgId`. The result is the same snapshot as converting
 * everything first (`buildSnapshot` still decides; live tasks still win).
 */
export const snapshotFromHost = (input: HostInput): Snapshot => {
  const live = input.live.map(toTask);
  const boundIds = new Set<string>();
  for (const [key, value] of Object.entries(input.records)) {
    if (!key.startsWith('binding:') || typeof value !== 'object' || value === null) continue;
    const { taskId } = value as { taskId?: unknown };
    if (typeof taskId === 'string') boundIds.add(taskId);
  }
  // A bound task's own repeatCfgId counts as a binding too; live wins.
  const liveIds = new Set(live.map((task) => task.id));
  const boundArchived = input.archived.filter(
    (task) => boundIds.has(task.id) && !liveIds.has(task.id),
  );
  const { cfgIds } = relevantIds(input.records, [...boundArchived.map(toTask), ...live]);
  return buildSnapshot({
    ...input,
    live,
    archived: input.archived
      .filter(
        (task) => boundIds.has(task.id) || (!!task.repeatCfgId && cfgIds.has(task.repeatCfgId)),
      )
      .map(toTask),
    repeatCfgs: input.repeatCfgs.map(toRepeatCfg),
  });
};

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
