import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * scripts/look-back.mjs (#84) on a small synthetic backup: no real data.
 * Needs the built engine (`npm test` builds it first).
 */
const script = join(import.meta.dirname, '..', '..', '..', 'scripts', 'look-back.mjs');
const dir = mkdtempSync(join(tmpdir(), 'look-back-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const day = (n: number): string => new Date(Date.UTC(2026, 9, n)).toISOString().slice(0, 10);
const noon = (n: number, extra = 0): number => Date.UTC(2026, 9, n, 12) + extra * 86_400_000;

// October 1-18 daily: ticked off on the day, except the 5th (the next day,
// inside the backfill window), the 9th and 10th (missed, ending the run)
// and the 15th (a single gap).
const ticks = [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 16, 17, 18];
const tasks = ticks.map((n) => ({
  id: `rpt_cfg1_${day(n)}`,
  title: 'SECRET TITLE',
  notes: 'SECRET NOTES',
  isDone: true,
  repeatCfgId: 'cfg1',
  created: noon(n),
  doneOn: n === 5 ? noon(5, 1) : noon(n),
}));

const record = (key: string, value: unknown, zip = false): { id: string; data: string } => {
  const text = JSON.stringify(value);
  return {
    id: `questarc:${key}`,
    data: zip ? `GZ1:${gzipSync(text).toString('base64')}` : text,
  };
};

const backup = {
  crossModelVersion: 4.5,
  data: {
    task: {
      ids: tasks.map((t) => t.id),
      entities: Object.fromEntries(tasks.map((t) => [t.id, t])),
    },
    archiveYoung: { task: { ids: [], entities: {} } },
    archiveOld: { task: { ids: [], entities: {} } },
    taskRepeatCfg: {
      ids: ['cfg1'],
      entities: {
        cfg1: {
          id: 'cfg1',
          title: 'SECRET TITLE',
          repeatCycle: 'DAILY',
          repeatEvery: 1,
          startDate: day(1),
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true,
        },
      },
    },
    globalConfig: { misc: { startOfNextDay: 0 } },
    pluginUserData: [
      record('run:r1', {
        journeyId: 'gentle-morning',
        journeyVersion: 3,
        startDay: day(1),
        why: 'SECRET REASON',
      }),
      record('stage:r1:water', { acceptedDay: day(1) }),
      record('binding:r1:water', {
        taskId: `rpt_cfg1_${day(1)}`,
        repeatCfgId: 'cfg1',
        day: day(1),
      }),
      record('checkin:r1:water:2026-W41', { score: 5 }, true),
      { id: 'other:thing', data: 'ignored' },
    ],
  },
};

const file = join(dir, 'backup.json');
writeFileSync(file, JSON.stringify(backup));
const run = (...extra: string[]): string =>
  execFileSync('node', [script, file, '--tz', 'UTC', ...extra], { encoding: 'utf8' });

describe('look-back script', () => {
  it('prints the numbers of a stage', () => {
    const text = run('--today', day(19));
    expect(text).toContain('run r1  journey gentle-morning');
    expect(text).toContain('stage water: met, accepted 2026-10-01');
    expect(text).toContain('due days 19: done 15, gaps 3, still open 1');
    expect(text).toContain('welcome backs 2, best run 8, run-ending misses 1');
    expect(text).toContain('days from acceptance to met: 5');
    expect(text).toContain('backfill window used 1 of 15 (same day 14, later than the window 0)');
    expect(text).toContain('weekly answers 1 of 3 weeks asked: 2026-W41=5');
    expect(text).toMatch(/stage stretch-1: ahead/);
  });

  it('names no title, note or reason', () => {
    expect(run('--today', day(19))).not.toMatch(/SECRET/);
  });

  it('writes nothing next to the backup', () => {
    const before = readdirSync(dir).sort();
    run('--today', day(19));
    expect(readdirSync(dir).sort()).toEqual(before);
  });

  it('fails calmly without an argument', () => {
    expect(() => execFileSync('node', [script], { stdio: 'pipe' })).toThrow(/usage/);
  });
});
