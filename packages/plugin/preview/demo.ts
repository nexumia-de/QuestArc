import type { Task } from '@questarc/sp-plugin-api';

/**
 * Demo datasets for the preview and screenshots (never real tasks). Days
 * are relative to `today`, so pictures look the same on any date.
 */

export type Scenario = 'welcome' | 'empty' | 'walking';

const DAY_MS = 86_400_000;

const dayString = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

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
  data.settings = JSON.stringify({ mode: 'calm' });
  if (scenario === 'empty') return { tasks, repeatCfgs, data };

  const todayMs = Date.parse(`${today}T12:00:00Z`);
  const start = dayString(todayMs - 9 * DAY_MS);
  repeatCfgs.demo = {
    id: 'demo',
    title: 'Drink a glass of water',
    isPaused: false,
    repeatCycle: 'DAILY',
    repeatEvery: 1,
    startDate: start,
  };
  // Done on most days, with one gap.
  for (const offset of [9, 8, 7, 5, 4, 3, 2, 1]) {
    const day = dayString(todayMs - offset * DAY_MS);
    tasks[`rpt_demo_${day}`] = {
      id: `rpt_demo_${day}`,
      title: 'Drink a glass of water',
      isDone: true,
      doneOn: Date.parse(`${day}T07:30:00Z`),
      repeatCfgId: 'demo',
      dueDay: day,
      created: Date.parse(`${day}T12:00:00Z`),
      timeSpentOnDay: {},
    } as Partial<Task> & { id: string };
  }
  Object.assign(data, {
    'run:demo-run': JSON.stringify({
      journeyId: 'gentle-morning',
      journeyVersion: 1,
      startDay: start,
    }),
    'stage:demo-run:water': JSON.stringify({ acceptedDay: start }),
    'binding:demo-run:water': JSON.stringify({
      taskId: `rpt_demo_${start}`,
      repeatCfgId: 'demo',
      day: start,
    }),
  });
  return { tasks, repeatCfgs, data };
};
