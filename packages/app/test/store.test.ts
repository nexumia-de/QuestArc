import { describe, expect, it } from 'vitest';

import { dayContext, dayStartTime, withDayStart } from '../src/day';
import { BackupError, parseBackup, toBackup } from '../src/store/backup';
import { freshDataset, INBOX_ID, TODAY_ID } from '../src/store/dataset';
import { createHabit, setDone, todaysTasks } from '../src/store/habits';
import { createInstances, localNoon } from '../src/store/instances';

const MONDAY = '2026-03-02';
const habit = (schedule: Parameters<typeof createHabit>[1]['schedule'], today = MONDAY) =>
  createHabit(freshDataset(), { cfgId: 'c', title: 'Water', schedule, today }).data;

describe('creating a habit', () => {
  it('makes the repeat config and today’s instance as Super Productivity would', () => {
    const data = habit({ type: 'daily' });
    expect(data.taskRepeatCfg.entities.c).toMatchObject({
      repeatCycle: 'DAILY',
      repeatEvery: 1,
      startDate: MONDAY,
      lastTaskCreationDay: MONDAY,
      skipOverdue: true,
      projectId: INBOX_ID,
    });
    const id = `rpt_c_${MONDAY}`;
    expect(data.task.ids).toEqual([id]);
    expect(data.task.entities[id]).toMatchObject({
      title: 'Water',
      isDone: false,
      dueDay: MONDAY,
      created: localNoon(MONDAY),
      repeatCfgId: 'c',
      projectId: INBOX_ID,
    });
    expect(data.project.entities[INBOX_ID]?.taskIds).toEqual([id]);
    expect(data.tag?.entities[TODAY_ID]?.taskIds).toEqual([id]);
  });

  it('puts the first task of chosen weekdays on the first of them', () => {
    const data = habit({ type: 'weekdays', days: ['wed', 'fri'] });
    expect(data.taskRepeatCfg.entities.c).toMatchObject({
      repeatCycle: 'WEEKLY',
      monday: false,
      wednesday: true,
      friday: true,
      lastTaskCreationDay: '2026-03-04',
    });
    expect(data.task.ids).toEqual(['rpt_c_2026-03-04']);
    expect(todaysTasks(data, MONDAY)).toEqual([]);
    expect(data.tag?.entities[TODAY_ID]?.taskIds).toEqual([]);
  });
});

describe('the day’s instances', () => {
  it('adds one per day and changes nothing when the day has its task', () => {
    const one = habit({ type: 'daily' });
    expect(createInstances(one, MONDAY)).toBe(one);
    const two = createInstances(one, '2026-03-03');
    expect(two.task.ids).toEqual(['rpt_c_2026-03-03', `rpt_c_${MONDAY}`]);
    expect(two.tag?.entities[TODAY_ID]?.taskIds).toEqual(['rpt_c_2026-03-03']);
    expect(createInstances(two, '2026-03-03')).toBe(two);
  });

  it('follows every n days and chosen weekdays', () => {
    const everyThird = habit({ type: 'everyNDays', n: 3 });
    const between = createInstances(everyThird, '2026-03-04');
    expect(between.task).toBe(everyThird.task);
    expect(between.tag?.entities[TODAY_ID]?.taskIds).toEqual([]);
    expect(createInstances(everyThird, '2026-03-05').task.ids[0]).toBe('rpt_c_2026-03-05');
    const weekdays = createInstances(
      habit({ type: 'weekdays', days: ['wed', 'fri'] }),
      '2026-03-06',
    );
    expect(weekdays.task.ids).toEqual(['rpt_c_2026-03-06', 'rpt_c_2026-03-04']);
  });

  it('makes only the newest missed occurrence, and none for a config that skips overdue ones', () => {
    // every 3 days from Monday: Thursday is the newest on or before Saturday
    const late = createInstances(habit({ type: 'everyNDays', n: 3 }), '2026-03-07');
    expect(late.task.ids[0]).toBe('rpt_c_2026-03-05');
    expect(todaysTasks(late, '2026-03-07').map((task) => task.id)).toEqual([
      'rpt_c_2026-03-05',
      `rpt_c_${MONDAY}`,
    ]);
    const daily = createInstances(habit({ type: 'daily' }), '2026-03-12');
    expect(daily.task.ids).toEqual(['rpt_c_2026-03-12', `rpt_c_${MONDAY}`]);
  });

  it('leaves paused habits and schedules a stage cannot use alone', () => {
    const data = habit({ type: 'daily' });
    const cfg = data.taskRepeatCfg.entities.c;
    const withCfg = (change: object) => ({
      ...data,
      taskRepeatCfg: { ...data.taskRepeatCfg, entities: { c: { ...cfg, ...change } } },
    });
    for (const change of [{ isPaused: true }, { repeatCycle: 'MONTHLY' }]) {
      const before = withCfg(change) as typeof data;
      expect(createInstances(before, '2026-03-03').task.ids).toEqual(before.task.ids);
    }
  });
});

describe('ticking off', () => {
  it('sets and removes doneOn', () => {
    const id = `rpt_c_${MONDAY}`;
    const done = setDone(habit({ type: 'daily' }), id, true, 1000);
    expect(done.task.entities[id]).toMatchObject({ isDone: true, doneOn: 1000 });
    const open = setDone(done, id, false, 2000);
    expect(open.task.entities[id]?.isDone).toBe(false);
    expect(open.task.entities[id]).not.toHaveProperty('doneOn');
    expect(setDone(open, id, false, 3000)).toBe(open);
  });
});

describe('backup files', () => {
  it('writes a CompleteBackup and reads it back unchanged', () => {
    const data = habit({ type: 'daily' });
    const backup = toBackup(data, 5);
    expect(backup).toMatchObject({ timestamp: 5, lastUpdate: 5, crossModelVersion: 4.5 });
    expect(parseBackup(JSON.stringify(backup))).toEqual(data);
  });

  it('reads a bare dataset and keeps slices it does not know', () => {
    const data = { ...freshDataset(), note: { ids: [], entities: {}, todayOrder: [] } };
    expect(parseBackup(JSON.stringify(data))).toEqual(data);
  });

  it('refuses what is not a backup and other data versions', () => {
    const problem = (text: string) => {
      try {
        parseBackup(text);
      } catch (error) {
        return (error as BackupError).problem;
      }
      return undefined;
    };
    expect(problem('{')).toBe('not-json');
    expect(problem('{"task":{}}')).toBe('not-a-backup');
    expect(problem(JSON.stringify({ ...toBackup(freshDataset(), 1), crossModelVersion: 5 }))).toBe(
      'other-version',
    );
  });
});

describe('the logical day', () => {
  it('starts at midnight without a setting and later with one', () => {
    const night = new Date('2026-03-03T01:30:00Z');
    const data = freshDataset();
    expect(dayContext(data, night)).toEqual({ todayStr: '2026-03-03', startOfNextDayDiffMs: 0 });
    const late = withDayStart(data, '04:00');
    expect(dayStartTime(late)).toBe('04:00');
    expect(dayContext(late, night)).toEqual({
      todayStr: MONDAY,
      startOfNextDayDiffMs: 4 * 3_600_000,
    });
    // Super Productivity's older setting in hours
    expect(dayStartTime({ ...data, globalConfig: { misc: { startOfNextDay: 2 } } })).toBe('02:00');
  });
});
