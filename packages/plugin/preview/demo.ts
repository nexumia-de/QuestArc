import type { Task } from '@super-productivity/plugin-api';

import { habitDemo, isHabitScenario, type HabitScenario } from './demo-habits';

/**
 * Demo datasets for the preview and screenshots (never real tasks). Days
 * are relative to `today`, so pictures look the same on any date.
 *
 * - welcome: first start; empty: no journey (the last one was ended)
 * - journey: stage 2 of "A gentle morning" with one gap
 * - paired: the same journey, the stage paired with something the user enjoys (#58)
 * - hard-week: two missed days in a row, with the user's plan check (#59)
 * - met: the current stage's condition is met
 * - stayed: the same, and the user chose to stay a while (#81)
 * - skipped: the first stage was passed with "I already do this" (#81)
 * - comeback: nothing counted for 18 days: the card after a long break (#82)
 * - smaller: the same, and the user started smaller three days ago
 * - unbound: the current stage has no recurring task yet
 * - newer: the journey was continued by a newer QuestArc (read-only)
 * - build: stage 3 under way: the hut stands, the marker has its
 *   posts and two pennants (#100); `preview.tick()` ticks today off
 * - build-ready: stage 3 met: every pennant on
 * - build-crossing: stage 3 under way, the user picked the
 *   Crossing with lanterns in sand
 * - habit, graduate, graduated, not-really, brought-back: the habit a
 *   finished journey leaves (demo-habits.ts, flow F)
 */

export type Scenario =
  | 'welcome'
  | 'empty'
  | 'journey'
  | 'paired'
  | 'hard-week'
  | 'met'
  | 'stayed'
  | 'skipped'
  | 'comeback'
  | 'smaller'
  | 'unbound'
  | 'newer'
  | 'build'
  | 'build-ready'
  | 'build-crossing'
  | HabitScenario;

const DAY_MS = 86_400_000;
const STAGES = ['water', 'stretch-1', 'stretch-5', 'plan-day'];

export interface DemoData {
  tasks: Record<string, Partial<Task> & { id: string }>;
  repeatCfgs: Record<string, Record<string, unknown>>;
  data: Record<string, string>;
}

export const demoData = (scenario: Scenario, today: string): DemoData => {
  const data: Record<string, string> = {};
  const tasks: DemoData['tasks'] = {};
  const repeatCfgs: DemoData['repeatCfgs'] = {};
  if (scenario === 'welcome') return { tasks, repeatCfgs, data };
  if (isHabitScenario(scenario)) return habitDemo(scenario, today);
  const build = scenario.startsWith('build');

  const todayMs = Date.parse(`${today}T12:00:00Z`);
  const day = (offset: number): string =>
    new Date(todayMs - offset * DAY_MS).toISOString().slice(0, 10);
  const long = scenario === 'comeback' || scenario === 'smaller';
  const current = build ? 2 : 1;
  // The day the current stage was accepted, as days before today.
  const since = long ? 30 : 10;
  const start = day(since + current * 9);
  const accepted = day(since);
  const record = (key: string, value: unknown) => {
    data[key] = JSON.stringify(value);
  };
  record('run:demo', {
    journeyId: 'gentle-morning',
    journeyVersion: 1,
    startDay: start,
    ...(long ? { why: 'I want my mornings to start calmly.' } : {}),
  });
  if (scenario === 'empty') {
    record('run-end:demo', { day: day(1) });
    return { tasks, repeatCfgs, data };
  }
  for (let i = 0; i < current; i += 1) {
    const stage = STAGES[i] as string;
    record(`stage:demo:${stage}`, { acceptedDay: day(since + (current - i) * 9) });
    if (scenario === 'skipped') record(`skip:demo:${stage}`, { day: day(10), dataFormat: 3 });
    else
      record(`stage-done:demo:${stage}`, {
        day: day(since + (current - i - 1) * 9),
        dataFormat: 2,
      });
  }
  const stage = STAGES[current] as string;
  record(`stage:demo:${stage}`, { acceptedDay: accepted });
  if (scenario === 'unbound') {
    // Recurring tasks the user already has: one a journey can follow, one not.
    repeatCfgs.stretch = {
      id: 'stretch',
      title: 'Morning stretch',
      isPaused: false,
      repeatCycle: 'DAILY',
      repeatEvery: 1,
    };
    repeatCfgs.bills = {
      id: 'bills',
      title: 'Pay the bills',
      isPaused: false,
      repeatCycle: 'MONTHLY',
      repeatEvery: 1,
    };
    return { tasks, repeatCfgs, data };
  }

  repeatCfgs.demo = {
    id: 'demo',
    title: 'Morning routine',
    isPaused: false,
    repeatCycle: 'DAILY',
    repeatEvery: 1,
    startDate: accepted,
  };
  const doneOffsets =
    scenario === 'met' || scenario === 'stayed' || scenario === 'build-ready'
      ? [6, 5, 4, 3, 2, 1]
      : long
        ? [30, 29, 28, 26, 25, 23, 22, 20, 19, 18]
        : build
          ? [4, 2, 1]
          : scenario === 'hard-week'
            ? [10, 9, 8, 7, 5, 4]
            : [10, 9, 8, 7, 5, 4, 2];
  const done = (cfgId: string, title: string, offset: number) => {
    const d = day(offset);
    tasks[`rpt_${cfgId}_${d}`] = {
      id: `rpt_${cfgId}_${d}`,
      title,
      isDone: true,
      doneOn: Date.parse(`${d}T07:30:00Z`),
      repeatCfgId: cfgId,
      dueDay: d,
      created: Date.parse(`${d}T12:00:00Z`),
      timeSpentOnDay: {},
    } as Partial<Task> & { id: string };
  };
  for (const offset of doneOffsets) done('demo', 'Morning routine', offset);
  if (long) {
    // The first stage's task still repeats, so starting smaller can use it.
    repeatCfgs.water = {
      id: 'water',
      title: 'Glass of water',
      isPaused: false,
      repeatCycle: 'DAILY',
      repeatEvery: 1,
      startDate: start,
    };
    done('water', 'Glass of water', since + 1);
    record('binding:demo:water', {
      taskId: `rpt_water_${day(since + 1)}`,
      repeatCfgId: 'water',
      day: start,
    });
  }
  if (scenario === 'smaller') {
    record(`step-back:demo:${stage}:${day(3)}`, { dataFormat: 4 });
    for (const offset of [3, 2, 1]) done('water', 'Glass of water', offset);
  }
  record(`binding:demo:${stage}`, {
    taskId: `rpt_demo_${day(since)}`,
    repeatCfgId: 'demo',
    day: accepted,
  });
  if (scenario === 'paired') record(`pair:demo:${stage}`, { text: 'my morning playlist' });
  if (scenario === 'hard-week')
    record('plan-check:demo', {
      wish: 'A calm start into the day',
      obstacle: 'Reaching for the phone first',
      plan: 'If I reach for the phone, then I will put it down and fill the glass',
    });
  if (scenario === 'stayed') record(`stay:demo:${stage}`, { day: day(1) });
  if (scenario === 'build-crossing')
    record('build:demo', { ladder: 'crossing', marker: 'lanterns', hue: 'sand' });
  if (scenario === 'newer') record(`graduation:demo:${stage}`, { dataFormat: 5, day: day(1) });
  return { tasks, repeatCfgs, data };
};
