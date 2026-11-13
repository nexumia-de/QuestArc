import { describe, expect, it } from 'vitest';
import {
  actions,
  answerCheckin,
  checkPlan,
  chooseBuild,
  continueJourney,
  endJourney,
  evaluate,
  pairStage,
  resumeJourney,
  skipStage,
  stayHere,
  undoSkip,
  withdraw,
} from '../src';
import type { Journey, Snapshot } from '../src';
import { loadVectors } from './vector-support';

/** The active run and journey of a vector's input. */
const fromVector = (file: string) => {
  const vector = loadVectors().find((v) => v.file === file);
  if (!vector || vector.kind === 'diff') throw new Error(file);
  const snapshot = vector.input as Snapshot;
  const run = evaluate(snapshot).active;
  if (!run) throw new Error(file);
  return { run, journey: snapshot.journeys[0] as Journey };
};

// The record-writing actions both hosts use (docs/data-model.md §2); the
// plugin's tests check startJourney, bindStage and continueJourney with
// real journeys. engine-cli.mjs looks actions up by these names.
describe('actions', () => {
  it('are callable by name for engine-cli.mjs', () => {
    expect(Object.keys(actions).sort()).toEqual([
      'answerCheckin',
      'bindStage',
      'checkPlan',
      'chooseBuild',
      'continueJourney',
      'endJourney',
      'pairStage',
      'pauseJourney',
      'repeatPause',
      'resumeJourney',
      'skipStage',
      'startJourney',
      'stayHere',
      'undoSkip',
      'withdraw',
    ]);
  });

  it('write the weekly answer and withdrawals', () => {
    expect(answerCheckin('r', 'walk', '2026-W45', 6)).toEqual({
      'checkin:r:walk:2026-W45': { score: 6 },
    });
    expect(withdraw('run-end:r')).toEqual({ 'run-end:r': '' });
  });

  it('resume one journey and pause the active one', () => {
    expect(resumeJourney('a', '2026-11-06', 'b')).toEqual({
      'pause:b:2026-11-06': { action: 'pause', source: 'user' },
      'pause:a:2026-11-06': { action: 'resume', source: 'user' },
    });
    expect(endJourney('a', '2026-11-06')).toEqual({
      'run-end:a': { day: '2026-11-06', reason: 'abandoned' },
    });
  });

  it("write what a stage is paired with as one line of the user's words", () => {
    expect(pairStage('r', 'walk', '  my   podcast. ')).toEqual({
      'pair:r:walk': { text: 'my podcast' },
    });
    expect(pairStage('r', 'walk', 'x'.repeat(80))).toEqual({
      'pair:r:walk': { text: 'x'.repeat(60) },
    });
    expect(pairStage('r', 'walk', ' . ')).toEqual({ 'pair:r:walk': '' });
  });

  it('take the pairing along when continuing, unless the next stage has its own', () => {
    const met = fromVector('pair-met-station.json');
    expect(continueJourney(met.run, met.journey, '2026-11-10')).toEqual({
      'stage-done:r1:a': { day: '2026-11-10', dataFormat: 2 },
      'stage:r1:b': { acceptedDay: '2026-11-10' },
      'pair:r1:b': { text: 'my podcast' },
    });
    const own = {
      ...met.run,
      stations: met.run.stations.map((s, i) => (i === 1 ? { ...s, pair: 'tea' } : s)),
    };
    expect(Object.keys(continueJourney(own, met.journey, '2026-11-10'))).toEqual([
      'stage-done:r1:a',
      'stage:r1:b',
    ]);
  });

  it('write the plan check as one record of the answers given, none withdraws it', () => {
    expect(
      checkPlan('r', {
        wish: ' more  air ',
        obstacle: '',
        plan: `If it rains,\nthen I will walk indoors. ${'x'.repeat(200)}`,
      }),
    ).toEqual({
      'plan-check:r': {
        wish: 'more air',
        plan: `If it rains, then I will walk indoors. ${'x'.repeat(121)}`,
      },
    });
    expect(checkPlan('r', { wish: ' ', plan: '' })).toEqual({ 'plan-check:r': '' });
  });

  it("write the user's build choice as one record, empty choice withdraws it", () => {
    expect(chooseBuild('r', { ladder: 'home', marker: 'flowers', hue: '' })).toEqual({
      'build:r': { ladder: 'home', marker: 'flowers' },
    });
    expect(chooseBuild('r', {})).toEqual({ 'build:r': '' });
  });

  it('stay only at a met station; the record names the day', () => {
    expect(stayHere(fromVector('stay-no-answer.json').run, '2026-11-10')).toEqual({
      'stay:r1:a': { day: '2026-11-10' },
    });
    expect(stayHere(fromVector('stay-not-met-no-offer.json').run, '2026-11-05')).toEqual({});
  });

  it('skip a stage that has no task yet, in data format 3, and accept the next', () => {
    const fresh = fromVector('skip-undone.json');
    expect(skipStage(fresh.run, fresh.journey, '2026-11-03')).toEqual({
      'skip:r1:a': { day: '2026-11-03', dataFormat: 3 },
      'stage:r1:b': { acceptedDay: '2026-11-03' },
    });
    const bound = fromVector('stay-not-met-no-offer.json');
    expect(skipStage(bound.run, bound.journey, '2026-11-05')).toEqual({});
  });

  it('refuse to skip the last stage', () => {
    const last = fromVector('skip-last-stage-refused.json');
    expect(last.run.position.stage).toBe(2);
    expect(skipStage(last.run, last.journey, '2026-11-05')).toEqual({});
  });

  it('take the latest skip back while the next stage has no completion', () => {
    const skipped = fromVector('skip-last-stage-refused.json');
    expect(undoSkip(skipped.run, skipped.journey, 'b')).toEqual({
      'skip:r1:b': '',
      'stage:r1:c': '',
    });
    expect(undoSkip(skipped.run, skipped.journey, 'a')).toEqual({});
    const counted = fromVector('skip-completions-give-nothing.json');
    expect(undoSkip(counted.run, counted.journey, 'a')).toEqual({});
  });
});
