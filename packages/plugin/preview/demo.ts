import type { Task } from '@questarc/sp-plugin-api';

/**
 * Demo datasets for the preview and screenshots (never real tasks). Days
 * are relative to `today`, so pictures look the same on any date.
 *
 * - welcome: first start; empty: no journey yet
 * - journey: calm, stage 2 of "A gentle morning" with one gap
 * - journey-rpg: with game, stage 3 with its guardian
 * - met: the current stage's condition is met
 * - unbound: the current stage has no recurring task yet
 */

export type Scenario = 'welcome' | 'empty' | 'journey' | 'journey-rpg' | 'met' | 'unbound';

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
  const rpg = scenario === 'journey-rpg';
  data.settings = JSON.stringify({ mode: rpg ? 'rpg' : 'calm' });
  if (scenario === 'empty') return { tasks, repeatCfgs, data };

  const todayMs = Date.parse(`${today}T12:00:00Z`);
  const day = (offset: number): string =>
    new Date(todayMs - offset * DAY_MS).toISOString().slice(0, 10);
  const current = rpg ? 2 : 1;
  const start = day(10 + current * 9);
  const accepted = day(10);
  const record = (key: string, value: unknown) => {
    data[key] = JSON.stringify(value);
  };
  record('run:demo', { journeyId: 'gentle-morning', journeyVersion: 1, startDay: start });
  for (let i = 0; i < current; i += 1) {
    const stage = STAGES[i] as string;
    record(`stage:demo:${stage}`, { acceptedDay: day(10 + (current - i) * 9) });
    record(`stage-done:demo:${stage}`, {
      day: day(10 + (current - i - 1) * 9),
      xp: 70,
      damage: 70,
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
  const doneOffsets = scenario === 'met' ? [6, 5, 4, 3, 2, 1] : [10, 9, 8, 7, 5, 4, 2];
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
  return { tasks, repeatCfgs, data };
};
