import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { HostInput, HostTask } from '../src/host-data';

/**
 * A large, deterministic evaluateHost input for the speed budget (issue #83):
 * about 50,000 unrelated archived tasks over five years, one journey with two
 * finished stages and a third in progress, and a bound daily repeat config
 * whose instances go back 1,800 days. Generated, never checked in; the same
 * options always give the same JSON (a fixed linear congruential generator,
 * no clock, no Math.random).
 */

const DAY_MS = 86_400_000;
const FIRST_DAY = Date.UTC(2021, 10, 7); // 2021-11-07, day 1 of the repeat
const TODAY = '2026-10-12'; // 1,800 days after FIRST_DAY

export interface LargeOptions {
  /** Unrelated done archived tasks. */
  readonly noise?: number;
  /** Daily instances of the bound repeat config (done on most days). */
  readonly instances?: number;
}

const ymd = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export const largeHostInput = ({
  noise = 50_000,
  instances = 1_800,
}: LargeOptions = {}): HostInput => {
  let seed = 12345;
  const next = (): number => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return seed;
  };
  const journey = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', 'vectors', 'journeys', 'test-daily.json'), 'utf8'),
  );

  const archived: HostTask[] = [];
  for (let i = 0; i < noise; i++) {
    const doneOn = FIRST_DAY - 3 * DAY_MS + (next() % (1_830 * DAY_MS));
    archived.push({
      id: `n${i}`,
      isDone: true,
      doneOn,
      created: doneOn - (next() % (5 * DAY_MS)),
      dueDay: ymd(doneOn),
      repeatCfgId: null,
      timeSpentOnDay: { [ymd(doneOn)]: 60_000 * (1 + (next() % 90)) },
    });
  }
  for (let i = 0; i < instances; i++) {
    const day = FIRST_DAY + i * DAY_MS;
    if (next() % 10 === 0) continue; // a missed day is a gap, not a task
    archived.push({
      id: `rpt_cfgA_${ymd(day)}`,
      isDone: true,
      doneOn: day + 9 * 3_600_000,
      created: day,
      dueDay: ymd(day),
      repeatCfgId: 'cfgA',
      timeSpentOnDay: { [ymd(day)]: 35 * 60_000 },
    });
  }

  return {
    day: { todayStr: TODAY, startOfNextDayDiffMs: 0, timeZone: 'Europe/Berlin' },
    live: [
      {
        id: 'live1',
        isDone: false,
        created: FIRST_DAY + 1_790 * DAY_MS,
        dueDay: TODAY,
        repeatCfgId: 'cfgA',
      },
    ],
    archived,
    repeatCfgs: [
      { id: 'cfgA', repeatCycle: 'DAILY', repeatEvery: 1, startDate: ymd(FIRST_DAY) },
      { id: 'cfgOther', repeatCycle: 'WEEKLY', repeatEvery: 1, monday: true },
    ],
    records: {
      'run:r1': { journeyId: 'test-daily', journeyVersion: 1, startDay: ymd(FIRST_DAY) },
      'stage:r1:a': { acceptedDay: ymd(FIRST_DAY) },
      'stage:r1:b': { acceptedDay: ymd(FIRST_DAY + 600 * DAY_MS) },
      'stage:r1:c': { acceptedDay: ymd(FIRST_DAY + 1_200 * DAY_MS) },
      'stage-done:r1:a': { day: ymd(FIRST_DAY + 600 * DAY_MS), xp: 4_000, damage: 4_000 },
      'stage-done:r1:b': { day: ymd(FIRST_DAY + 1_200 * DAY_MS), xp: 3_000, damage: 0 },
      'binding:r1:a': { taskId: 'live1', repeatCfgId: 'cfgA', day: ymd(FIRST_DAY) },
      'binding:r1:b': { taskId: 'live1', repeatCfgId: 'cfgA', day: ymd(FIRST_DAY + 600 * DAY_MS) },
      'binding:r1:c': {
        taskId: 'live1',
        repeatCfgId: 'cfgA',
        day: ymd(FIRST_DAY + 1_200 * DAY_MS),
      },
    },
    journeys: [journey],
  };
};
