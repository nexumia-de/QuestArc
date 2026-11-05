import type { Snapshot, SnapshotTask } from '@questarc/engine';
import type { Task } from '@questarc/sp-plugin-api';

/** Super Productivity sets wontDoOn at runtime; the plugin type omits it. */
type TaskWithWontDo = Task & { wontDoOn?: number | null };

const toSnapshotTask = (task: TaskWithWontDo): SnapshotTask => ({
  id: task.id,
  isDone: task.isDone,
  doneOn: task.doneOn ?? null,
  wontDoOn: task.wontDoOn ?? null,
  timeSpentOnDay: task.timeSpentOnDay,
});

/** Local calendar day as YYYY-MM-DD, used where getDayContext() is missing. */
const localDay = (date: Date): string =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, '0'))
    .join('-');

/**
 * Collect the engine's input through the plugin API. getDayContext() exists
 * only after Super Productivity 19.3.1 (docs/super-productivity-facts.md).
 */
export const loadSnapshot = async (): Promise<Snapshot> => {
  const [tasks, archived] = await Promise.all([PluginAPI.getTasks(), PluginAPI.getArchivedTasks()]);
  const day = PluginAPI.getDayContext ? await PluginAPI.getDayContext() : null;
  return {
    tasks: [...tasks, ...archived].map(toSnapshotTask),
    todayStr: day?.todayStr ?? localDay(new Date()),
  };
};
