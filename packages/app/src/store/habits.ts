import type { Schedule } from '@questarc/engine';

import type { Dataset, StoredRepeatCfg, StoredTask } from './dataset';
import { INBOX_ID } from './dataset';
import { addDays, instanceId, newInstance, projectFor, withTask, withTodayList } from './instances';

/**
 * A habit is a repeat config plus its tasks, as in Super Productivity:
 * creating one, ticking a task off and undoing that.
 */

const WEEKDAYS = {
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
  sun: 'sunday',
} as const;
type Short = keyof typeof WEEKDAYS;

/**
 * The repeat config for a stage's schedule with Super Productivity's
 * defaults for the other fields (DEFAULT_TASK_REPEAT_CFG, values
 * transcribed from Super Productivity 19.3.1, commit 590178d7,
 * src/app/features/task-repeat-cfg/task-repeat-cfg.model.ts, MIT,
 * © Johannes Millan). `skipOverdue` is on only for every single day, as
 * its dialog sets it.
 */
export const repeatCfgFor = (
  id: string,
  title: string,
  schedule: Schedule,
  startDate: string,
): StoredRepeatCfg => ({
  id,
  title,
  projectId: INBOX_ID,
  repeatEvery: schedule.type === 'everyNDays' ? schedule.n : 1,
  isPaused: false,
  quickSetting: schedule.type === 'daily' ? 'DAILY' : 'CUSTOM',
  repeatCycle: schedule.type === 'weekdays' ? 'WEEKLY' : 'DAILY',
  repeatFromCompletionDate: false,
  waitForCompletion: false,
  ...Object.fromEntries(
    Object.entries(WEEKDAYS).map(([short, name]) => [
      name,
      schedule.type !== 'weekdays' || schedule.days.includes(short as Short),
    ]),
  ),
  tagIds: [],
  order: 0,
  shouldInheritSubtasks: false,
  disableAutoUpdateSubtasks: false,
  skipOverdue: schedule.type === 'daily',
  startDate,
});

/** The first occurrence on or after `from`: within a week for chosen weekdays. */
const firstDay = (schedule: Schedule, from: string): string => {
  if (schedule.type !== 'weekdays') return from;
  const names = Object.keys(WEEKDAYS) as Short[];
  for (let n = 0; n < 7; n += 1) {
    const day = addDays(from, n);
    const short = names[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7];
    if (short && schedule.days.includes(short)) return day;
  }
  return from;
};

/**
 * A new habit: the repeat config and its first task, which is the
 * instance of the first occurrence (today for daily and every n days).
 */
export const createHabit = (
  data: Dataset,
  habit: { cfgId: string; title: string; schedule: Schedule; today: string },
): { data: Dataset; taskId: string } => {
  const day = firstDay(habit.schedule, habit.today);
  const cfg = {
    ...repeatCfgFor(habit.cfgId, habit.title, habit.schedule, habit.today),
    lastTaskCreationDay: day,
  };
  const withCfg: Dataset = {
    ...data,
    taskRepeatCfg: {
      ...data.taskRepeatCfg,
      ids: [...data.taskRepeatCfg.ids, cfg.id],
      entities: { ...data.taskRepeatCfg.entities, [cfg.id]: cfg },
    },
  };
  const task = newInstance(cfg, day, projectFor(withCfg, cfg) ?? INBOX_ID);
  return {
    data: withTodayList(withTask(withCfg, task), habit.today),
    taskId: instanceId(cfg.id, day),
  };
};

/** Ticks a task off or undoes it; `doneOn` is removed, never set to null. */
export const setDone = (data: Dataset, taskId: string, done: boolean, now: number): Dataset => {
  const task = data.task.entities[taskId];
  if (!task || task.isDone === done) return data;
  const open: StoredTask = { ...task, isDone: false };
  delete (open as { doneOn?: unknown }).doneOn;
  const next: StoredTask = done ? { ...task, isDone: true, doneOn: now } : open;
  return { ...data, task: { ...data.task, entities: { ...data.task.entities, [taskId]: next } } };
};

/** The habits' tasks for today: due today, or due earlier and still open. */
export const todaysTasks = (data: Dataset, today: string): StoredTask[] =>
  data.task.ids
    .map((id) => data.task.entities[id])
    .filter(
      (task): task is StoredTask =>
        !!task?.repeatCfgId &&
        typeof task.dueDay === 'string' &&
        (task.dueDay === today || (task.dueDay < today && !task.isDone)),
    );
