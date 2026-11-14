import type { Task } from '@super-productivity/plugin-api';

import type { DemoData } from './demo';
import { own } from './demo-words';

/**
 * Demo datasets for the home with several moments (#96, never real
 * tasks):
 *
 * - moments: "After getting up" with a step that runs by itself; "After
 *   lunch" with the growing step (A walk after lunch, station 2);
 *   "Evening", a fixed time, with a habit that is still followed and a
 *   journey that waits
 * - moments-chain: the same, but the walk starts from the morning and is
 *   tied to the step that runs by itself there
 * - moments-rest: without the walk: the journey that waits in the evening
 *   is the only open one, so it is the active one, paused
 */

export const MOMENT_SCENARIOS = ['moments', 'moments-chain', 'moments-rest'] as const;
export type MomentScenario = (typeof MOMENT_SCENARIOS)[number];

export const isMomentScenario = (scenario: string): scenario is MomentScenario =>
  (MOMENT_SCENARIOS as readonly string[]).includes(scenario);

const DAY_MS = 86_400_000;

export const momentsDemo = (scenario: MomentScenario, today: string): DemoData => {
  const data: Record<string, string> = {};
  const tasks: DemoData['tasks'] = {};
  const repeatCfgs: DemoData['repeatCfgs'] = {};
  const todayMs = Date.parse(`${today}T12:00:00Z`);
  const day = (offset: number): string =>
    new Date(todayMs - offset * DAY_MS).toISOString().slice(0, 10);
  const record = (key: string, value: unknown) => {
    data[key] = JSON.stringify(value);
  };
  const repeat = (id: string, title: string, start: number, done: number[]) => {
    repeatCfgs[id] = {
      id,
      title,
      isPaused: false,
      repeatCycle: 'DAILY',
      repeatEvery: 1,
      startDate: day(start),
    };
    for (const offset of done) {
      const d = day(offset);
      tasks[`rpt_${id}_${d}`] = {
        id: `rpt_${id}_${d}`,
        title,
        isDone: true,
        doneOn: Date.parse(`${d}T07:30:00Z`),
        repeatCfgId: id,
        dueDay: d,
        created: Date.parse(`${d}T12:00:00Z`),
        timeSpentOnDay: {},
      } as Partial<Task> & { id: string };
    }
  };
  /** A finished journey: its stages 15 days apart, the last one `end` days ago. */
  const finished = (run: string, journeyId: string, stages: string[], end: number) => {
    const start = end + stages.length * 15;
    record(`run:${run}`, { journeyId, journeyVersion: 1, startDay: day(start) });
    stages.forEach((stage, i) => {
      record(`stage:${run}:${stage}`, { acceptedDay: day(start - i * 15) });
      record(`stage-done:${run}:${stage}`, { day: day(start - (i + 1) * 15), dataFormat: 2 });
    });
    record(`run-end:${run}`, { day: day(end), reason: 'finished' });
  };

  record('anchor:morning', { kind: 'routine', words: own('getting up') });
  record('anchor:noon', { kind: 'routine', words: own('lunch') });
  record('anchor:evening', { kind: 'time', time: '21:30', name: own('Evening') });

  // A gentle morning: finished 60 days ago, runs by itself for a month.
  finished('morning', 'gentle-morning', ['water', 'stretch-1', 'stretch-5', 'plan-day'], 60);
  record(`graduation:morning:plan-day:${day(30)}`, { choice: 'end' });
  record('run-anchor:morning', { anchorId: 'morning' });

  // A few pages before sleep: finished 20 days ago, still followed.
  finished('pages', 'pages-before-sleep', ['one-page', 'read-5', 'read-10', 'read-20'], 20);
  record('binding:pages:read-20', {
    taskId: `rpt_pages_${day(35)}`,
    repeatCfgId: 'pages',
    day: day(35),
  });
  repeat(
    'pages',
    own('Read in my book'),
    35,
    Array.from({ length: 35 }, (_, i) => i + 1).filter((offset) => offset !== 9),
  );
  record('run-anchor:pages', { anchorId: 'evening' });

  // Evening wind-down waits at its first station.
  record('run:wind', { journeyId: 'evening-wind-down', journeyVersion: 1, startDay: day(12) });
  record('stage:wind:charger', { acceptedDay: day(12) });
  record(`pause:wind:${day(10)}`, { action: 'pause', source: 'user' });
  record('run-anchor:wind', { anchorId: 'evening' });

  if (scenario === 'moments-rest') return { tasks, repeatCfgs, data };

  // A walk after lunch: station 2, four of the last days done, today open.
  record('run:demo', { journeyId: 'walk-after-lunch', journeyVersion: 1, startDay: day(10) });
  record('stage:demo:door', { acceptedDay: day(10) });
  record('stage-done:demo:door', { day: day(5), dataFormat: 2 });
  record('stage:demo:walk-5', { acceptedDay: day(5) });
  record('binding:demo:walk-5', {
    taskId: `rpt_demo_${day(5)}`,
    repeatCfgId: 'demo',
    day: day(5),
  });
  repeat('demo', own('Walk after lunch'), 5, [5, 4, 2, 1]);
  record(
    'run-anchor:demo',
    scenario === 'moments-chain' ? { anchorId: 'morning', after: 'morning' } : { anchorId: 'noon' },
  );
  return { tasks, repeatCfgs, data };
};
