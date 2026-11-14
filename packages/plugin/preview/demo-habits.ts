import { isoWeek } from '@questarc/engine';
import type { Task } from '@super-productivity/plugin-api';

import type { DemoData } from './demo';

/**
 * Demo datasets for the habit a finished journey leaves (flow F, never
 * real tasks): "A gentle morning" was finished 40 days ago and its last
 * habit kept repeating.
 *
 * - habit: maintained, the weekly question is due; answers of eight weeks
 * - graduate: the last three answers are high: it can graduate
 * - graduated: it graduated 15 days ago (the user ends the repeat): the
 *   question after two weeks is due
 * - not-really: the same, answered with "not really"
 * - brought-back: brought back three days ago; its repeat is gone
 */

export const HABIT_SCENARIOS = [
  'habit',
  'graduate',
  'graduated',
  'not-really',
  'brought-back',
] as const;
export type HabitScenario = (typeof HABIT_SCENARIOS)[number];

export const isHabitScenario = (scenario: string): scenario is HabitScenario =>
  (HABIT_SCENARIOS as readonly string[]).includes(scenario);

const DAY_MS = 86_400_000;
const STAGES = ['water', 'stretch-1', 'stretch-5', 'plan-day'];
const LAST = 'plan-day';

export const habitDemo = (scenario: HabitScenario, today: string): DemoData => {
  const data: Record<string, string> = {};
  const tasks: DemoData['tasks'] = {};
  const repeatCfgs: DemoData['repeatCfgs'] = {};
  const todayMs = Date.parse(`${today}T12:00:00Z`);
  const day = (offset: number): string =>
    new Date(todayMs - offset * DAY_MS).toISOString().slice(0, 10);
  const record = (key: string, value: unknown) => {
    data[key] = JSON.stringify(value);
  };

  // Four stages of 15 days each; the journey finished 40 days ago.
  record('run:demo', { journeyId: 'gentle-morning', journeyVersion: 1, startDay: day(100) });
  STAGES.forEach((stage, i) => {
    record(`stage:demo:${stage}`, { acceptedDay: day(100 - i * 15) });
    record(`stage-done:demo:${stage}`, { day: day(i === 3 ? 40 : 85 - i * 15), dataFormat: 2 });
  });
  record('run-end:demo', { day: day(40), reason: 'finished' });
  record('anchor:morning', { kind: 'routine', words: 'getting up' });
  record('run-anchor:demo', { anchorId: 'morning' });
  record(`binding:demo:${LAST}`, {
    taskId: `rpt_demo_${day(55)}`,
    repeatCfgId: 'demo',
    day: day(55),
  });

  // The weekly answers, oldest first; the last one is this week's.
  const answers = scenario === 'habit' ? [3, 4, 4, 0, 5, 5, 6, 0] : [3, 4, 4, 0, 5, 6, 6, 7];
  answers.forEach((score, i) => {
    const week = isoWeek(day((answers.length - 1 - i) * 7));
    if (score > 0) record(`checkin:demo:${LAST}:${week}`, { score });
  });

  const since = { graduated: 15, 'not-really': 15, 'brought-back': 30 }[scenario as string];
  if (since !== undefined) {
    record(`graduation:demo:${LAST}:${day(since)}`, {
      choice: 'end',
      ...(scenario === 'brought-back' ? { until: day(3) } : {}),
    });
  }
  if (scenario === 'not-really') {
    record(`graduation-check:demo:${LAST}:${day(1)}`, { day: today, still: false });
  }
  // A habit that was brought back after its repeat was ended has no task.
  if (scenario === 'brought-back') return { tasks, repeatCfgs, data };

  repeatCfgs.demo = {
    id: 'demo',
    title: 'Plan the day',
    isPaused: false,
    repeatCycle: 'DAILY',
    repeatEvery: 1,
    startDate: day(55),
  };
  for (let offset = 55; offset >= 1; offset -= 1) {
    if (offset === 31 || offset === 12) continue; // two single gaps
    const d = day(offset);
    tasks[`rpt_demo_${d}`] = {
      id: `rpt_demo_${d}`,
      title: 'Plan the day',
      isDone: true,
      doneOn: Date.parse(`${d}T07:30:00Z`),
      repeatCfgId: 'demo',
      dueDay: d,
      created: Date.parse(`${d}T12:00:00Z`),
      timeSpentOnDay: {},
    } as Partial<Task> & { id: string };
  }
  return { tasks, repeatCfgs, data };
};
