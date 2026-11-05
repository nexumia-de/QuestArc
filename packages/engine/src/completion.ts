import type { SnapshotTask } from './snapshot';

/**
 * A task counts as completed when it is done and was not finished as
 * "won't do" (Super Productivity marks those done too, with
 * wontDoOn === doneOn; see docs/super-productivity-facts.md).
 */
export const isCompleted = (task: SnapshotTask): boolean =>
  task.isDone && !(task.wontDoOn != null && task.wontDoOn === task.doneOn);

/** Total time spent on a task over all days, in milliseconds. */
export const timeSpentMs = (task: SnapshotTask): number =>
  Object.values(task.timeSpentOnDay ?? {}).reduce((sum, ms) => sum + ms, 0);
