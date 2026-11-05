import { addDays, isDay } from './days';
import type { SnapshotTask } from './types/snapshot';

/**
 * Which day a completion counts for (docs/game-rules.md §1–2).
 */

/** Done and not finished as "won't do" (wontDoOn === doneOn). */
export const isCompleted = (task: SnapshotTask): boolean =>
  task.isDone && !(task.wontDoOn != null && task.wontDoOn === task.doneOn);

/**
 * The day an instance belongs to: from its id `rpt_<cfgId>_<day>`, else its
 * dueDay, else the logical day it was created (archived tasks lose dueDay).
 */
export const instanceDay = (
  task: SnapshotTask,
  cfgId: string,
  logicalDay: (timestamp: number) => string,
): string | undefined => {
  const prefix = `rpt_${cfgId}_`;
  if (task.id.startsWith(prefix)) {
    const day = task.id.slice(prefix.length);
    if (isDay(day)) return day;
  }
  if (isDay(task.dueDay)) return task.dueDay;
  if (typeof task.created === 'number') return logicalDay(task.created);
  return undefined;
};

/**
 * The day a completed instance counts for: its own day if it was ticked
 * off by the end of the next logical day (backfill window), otherwise the
 * day it was ticked off.
 */
export const creditDay = (
  task: SnapshotTask,
  cfgId: string,
  logicalDay: (timestamp: number) => string,
): string | undefined => {
  if (!isCompleted(task)) return undefined;
  const own = instanceDay(task, cfgId, logicalDay);
  const done = typeof task.doneOn === 'number' ? logicalDay(task.doneOn) : undefined;
  if (own === undefined) return done;
  if (done === undefined || done <= addDays(own, 1)) return own;
  return done;
};

/**
 * Days with a counting completion on or after `from` and not after
 * `today`; at most one completion counts per day.
 */
export const creditedDays = (
  tasks: readonly SnapshotTask[],
  cfgId: string,
  from: string,
  today: string,
  logicalDay: (timestamp: number) => string,
): Set<string> => {
  const days = new Set<string>();
  for (const task of tasks) {
    const day = creditDay(task, cfgId, logicalDay);
    if (day !== undefined && day >= from && day <= today) days.add(day);
  }
  return days;
};

/** Minutes tracked on the tasks on days from `from` to `today`. */
export const minutesTracked = (
  tasks: readonly SnapshotTask[],
  from: string,
  today: string,
): number => {
  let ms = 0;
  for (const task of tasks) {
    for (const [day, spent] of Object.entries(task.timeSpentOnDay ?? {})) {
      if (day >= from && day <= today && Number.isFinite(spent)) ms += spent;
    }
  }
  return Math.floor(ms / 60_000);
};
