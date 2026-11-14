import { isScheduled, isSupported, toRepeatCfg } from '@questarc/engine';

import { INBOX_ID, TODAY_ID, archivedTasks } from './dataset';
import type { Dataset, StoredRepeatCfg, StoredTask } from './dataset';

/**
 * Creates the day's task of each habit the way Super Productivity does
 * (docs/super-productivity-facts.md §5): one instance per repeat config
 * for the newest occurrence on or before today, id `rpt_<cfgId>_<day>`.
 * Only the schedules a stage may use get instances (daily, every n days,
 * chosen weekdays); other configs are left alone.
 */

const DAY_MS = 86_400_000;
/** Far more than the longest step between two occurrences (7 days). */
const LOOK_BACK_DAYS = 31;

export const addDays = (day: string, n: number): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/** Local noon of a day in ms: `created` of an instance. */
export const localNoon = (day: string): number => {
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12).getTime();
};

export const instanceId = (cfgId: string, day: string): string => `rpt_${cfgId}_${day}`;

export const canCreate = (cfg: StoredRepeatCfg): boolean =>
  !cfg.isPaused && isSupported(toRepeatCfg(cfg));

/** The newest occurrence after the last created one and on or before `today`. */
export const dueDay = (cfg: StoredRepeatCfg, today: string): string | undefined => {
  if (!canCreate(cfg) || cfg.deletedInstanceDates?.includes(today)) return undefined;
  const schedule = toRepeatCfg(cfg);
  for (let back = 0; back < LOOK_BACK_DAYS; back += 1) {
    const day = addDays(today, -back);
    if (cfg.lastTaskCreationDay && day <= cfg.lastTaskCreationDay) return undefined;
    if (isScheduled(schedule, day)) return day;
  }
  return undefined;
};

export const newInstance = (cfg: StoredRepeatCfg, day: string, projectId: string): StoredTask => ({
  id: instanceId(cfg.id, day),
  title: cfg.title ?? '',
  projectId,
  subTaskIds: [],
  timeSpentOnDay: {},
  timeSpent: 0,
  timeEstimate: cfg.defaultEstimate ?? 0,
  isDone: false,
  tagIds: [...(cfg.tagIds ?? [])],
  created: localNoon(day),
  attachments: [],
  dueDay: day,
  repeatCfgId: cfg.id,
});

/** Adds a task to the live list and to the front of its project's list. */
export const withTask = (data: Dataset, task: StoredTask): Dataset => {
  const project = data.project.entities[task.projectId];
  return {
    ...data,
    task: {
      ...data.task,
      ids: [task.id, ...data.task.ids],
      entities: { ...data.task.entities, [task.id]: task },
    },
    project: project
      ? {
          ...data.project,
          entities: {
            ...data.project.entities,
            [project.id]: { ...project, taskIds: [task.id, ...project.taskIds] },
          },
        }
      : data.project,
  };
};

export const projectFor = (data: Dataset, cfg: StoredRepeatCfg): string | undefined =>
  [cfg.projectId, INBOX_ID, data.project.ids[0]].find(
    (id): id is string => typeof id === 'string' && id in data.project.entities,
  );

/**
 * The Today tag's list as Super Productivity keeps it: the live tasks
 * due today. It repairs a list that differs when it loads the data.
 */
export const withTodayList = (data: Dataset, today: string): Dataset => {
  const tag = data.tag?.entities[TODAY_ID];
  if (!data.tag || !tag) return data;
  const due = data.task.ids.filter((id) => data.task.entities[id]?.dueDay === today);
  const kept = tag.taskIds.filter((id) => due.includes(id));
  const taskIds = [...due.filter((id) => !kept.includes(id)), ...kept];
  if (taskIds.join() === tag.taskIds.join()) return data;
  return {
    ...data,
    tag: { ...data.tag, entities: { ...data.tag.entities, [TODAY_ID]: { ...tag, taskIds } } },
  };
};

/**
 * The dataset with today's instances and Today list; the same object
 * when nothing changed.
 */
export const createInstances = (data: Dataset, today: string): Dataset => {
  let next = data;
  const archived = new Set(archivedTasks(data).map((task) => task.id));
  for (const cfg of Object.values(data.taskRepeatCfg.entities)) {
    const day = dueDay(cfg, today);
    if (!day) continue;
    const id = instanceId(cfg.id, day);
    const projectId = projectFor(next, cfg);
    const exists = id in next.task.entities || archived.has(id);
    // A missed occurrence of a config that skips overdue ones is not made.
    const skipped = day < today && cfg.skipOverdue === true;
    if (!exists && !skipped && projectId) next = withTask(next, newInstance(cfg, day, projectId));
    next = {
      ...next,
      taskRepeatCfg: {
        ...next.taskRepeatCfg,
        entities: {
          ...next.taskRepeatCfg.entities,
          [cfg.id]: { ...cfg, lastTaskCreationDay: day },
        },
      },
    };
  }
  return withTodayList(next, today);
};
