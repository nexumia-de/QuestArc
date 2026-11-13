import type { Task } from '@questarc/sp-plugin-api';

/**
 * Demo datasets for the preview and screenshots (never real tasks). Days
 * are relative to `today`, so pictures look the same on any date.
 *
 * - welcome: first start; empty: no journey (the last one was ended)
 * - journey: stage 2 of "A gentle morning" with one gap
 * - met: the current stage's condition is met
 * - unbound: the current stage has no recurring task yet
 * - newer: the journey was continued by a newer QuestArc (read-only)
 * - build: stage 3 under way: the hut stands, the marker has its
 *   posts and two pennants (#100); `preview.tick()` ticks today off
 * - build-ready: stage 3 met: every pennant on
 * - build-crossing: stage 3 under way, the user picked the
 *   Crossing with lanterns in sand
 */

export type Scenario =
  | 'welcome'
  | 'empty'
  | 'journey'
  | 'met'
  | 'unbound'
  | 'newer'
  | 'build'
  | 'build-ready'
  | 'build-crossing';

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
  const build = scenario.startsWith('build');

  const todayMs = Date.parse(`${today}T12:00:00Z`);
  const day = (offset: number): string =>
    new Date(todayMs - offset * DAY_MS).toISOString().slice(0, 10);
  const current = build ? 2 : 1;
  const start = day(10 + current * 9);
  const accepted = day(10);
  const record = (key: string, value: unknown) => {
    data[key] = JSON.stringify(value);
  };
  record('run:demo', { journeyId: 'gentle-morning', journeyVersion: 1, startDay: start });
  if (scenario === 'empty') {
    record('run-end:demo', { day: day(1) });
    return { tasks, repeatCfgs, data };
  }
  for (let i = 0; i < current; i += 1) {
    const stage = STAGES[i] as string;
    record(`stage:demo:${stage}`, { acceptedDay: day(10 + (current - i) * 9) });
    record(`stage-done:demo:${stage}`, {
      day: day(10 + (current - i - 1) * 9),
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
    scenario === 'met' || scenario === 'build-ready'
      ? [6, 5, 4, 3, 2, 1]
      : build
        ? [4, 2, 1]
        : [10, 9, 8, 7, 5, 4, 2];
  for (const offset of doneOffsets) {
    const d = day(offset);
    tasks[`rpt_demo_${d}`] = {
      id: `rpt_demo_${d}`,
      title: 'Morning routine',
      isDone: true,
      doneOn: Date.parse(`${d}T07:30:00Z`),
      repeatCfgId: 'demo',
      dueDay: d,
      created: Date.parse(`${d}T12:00:00Z`),
      timeSpentOnDay: {},
    } as Partial<Task> & { id: string };
  }
  record(`binding:demo:${stage}`, {
    taskId: `rpt_demo_${day(10)}`,
    repeatCfgId: 'demo',
    day: accepted,
  });
  if (scenario === 'build-crossing')
    record('build:demo', { ladder: 'crossing', marker: 'lanterns', hue: 'sand' });
  if (scenario === 'newer') record(`graduation:demo:${stage}`, { dataFormat: 3, day: day(1) });
  return { tasks, repeatCfgs, data };
};
