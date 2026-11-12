import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';

import { evaluate } from '../src/evaluate';
import {
  buildSnapshot,
  snapshotFromHost,
  toRepeatCfg,
  toTask,
  type HostInput,
} from '../src/host-data';
import { largeHostInput } from './large-snapshot';

/**
 * Speed budget (issue #83, docs/decisions/engine-in-gjs.md): evaluating a
 * large archive, about 50,000 archived tasks over five years plus a bound
 * repeat config with 1,800 days of history, must stay fast, because both
 * hosts hand the whole archive to the engine on every change. The budgets
 * have head room for slow CI runners; the result must not change, so the
 * test also checks what the engine says about the journey.
 *
 * QUESTARC_SPEED_REPORT names a file that gets one Markdown table row per
 * measurement (the aarch64 CI job writes it to the job summary).
 */

const NODE_BUDGET_MS = 300; // JSON.parse + snapshotFromHost + evaluate, best of 5
const GJS_BUDGET_MS = 1_000; // whole gjs process including start, best of 3
const RUNS = 5;

const input = largeHostInput();
const json = JSON.stringify(input);
const megabytes = (json.length / 1e6).toFixed(1);

const report = (runtime: string, what: string, ms: number[]): void => {
  const best = Math.round(Math.min(...ms));
  const row = `| ${runtime} | ${what} | ${megabytes} MB | ${ms.map(Math.round).join(', ')} | ${best} |`;
  console.log(row);
  const file = process.env.QUESTARC_SPEED_REPORT;
  if (file) appendFileSync(file, `${row}\n`);
};

interface View {
  active: { stations: { stageId: string; state: string; xp: number; completions: number }[] };
}

/** What the large input must give; a faster engine must not change it. */
const expectedStations = (view: View): void => {
  expect(view.active.stations.map((s) => [s.stageId, s.state, s.xp, s.completions])).toEqual([
    ['a', 'done', 4_000, 0],
    ['b', 'done', 3_000, 0],
    ['c', 'met', 6_000, 559],
  ]);
};

describe('speed budget: large archive', () => {
  it('has the size the issue asks for', () => {
    expect(input.archived.length).toBeGreaterThan(50_000);
  });

  it('filters the archive without changing the snapshot', () => {
    // the filter in snapshotFromHost must equal converting everything first
    const slow = buildSnapshot({
      ...input,
      live: input.live.map(toTask),
      archived: input.archived.map(toTask),
      repeatCfgs: input.repeatCfgs.map(toRepeatCfg),
    });
    expect(snapshotFromHost(input)).toEqual(slow);
  });

  it(`evaluates in Node within ${NODE_BUDGET_MS} ms`, () => {
    const times: number[] = [];
    let view: unknown;
    for (let i = 0; i < RUNS; i++) {
      const t = performance.now();
      view = evaluate(snapshotFromHost(JSON.parse(json) as HostInput));
      times.push(performance.now() - t);
    }
    report('Node', 'parse + evaluateHost', times);
    expectedStations(view as View);
    expect(Math.min(...times)).toBeLessThan(NODE_BUDGET_MS);
  });

  const gjs = process.env.QUESTARC_GJS;
  const cli = join(import.meta.dirname, '..', 'dist', 'engine-cli.mjs');
  it.skipIf(!gjs)(`evaluates in gjs within ${GJS_BUDGET_MS} ms, process start included`, () => {
    const request = JSON.stringify({ evaluateHost: input });
    const times: number[] = [];
    let view: unknown;
    for (let i = 0; i < 3; i++) {
      const t = performance.now();
      view = JSON.parse(
        execFileSync(gjs as string, ['-m', cli], {
          input: request,
          encoding: 'utf8',
          maxBuffer: 1 << 26,
        }),
      );
      times.push(performance.now() - t);
    }
    report('gjs', 'process: start + parse + evaluateHost', times);
    expectedStations(view as View);
    expect(Math.min(...times)).toBeLessThan(GJS_BUDGET_MS);
  });
});
