import { describe, expect, it } from 'vitest';
import { actions, answerCheckin, endJourney, resumeJourney, setMode, withdraw } from '../src';

// The record-writing actions both hosts use (docs/data-model.md §2); the
// plugin's tests check startJourney, bindStage and continueJourney with
// real journeys. engine-cli.mjs looks actions up by these names.
describe('actions', () => {
  it('are callable by name for engine-cli.mjs', () => {
    expect(Object.keys(actions).sort()).toEqual([
      'answerCheckin',
      'bindStage',
      'continueJourney',
      'endJourney',
      'pauseJourney',
      'repeatPause',
      'resumeJourney',
      'setMode',
      'startJourney',
      'withdraw',
    ]);
  });

  it('write the weekly answer, the mode and withdrawals', () => {
    expect(answerCheckin('r', 'walk', '2026-W45', 6)).toEqual({
      'checkin:r:walk:2026-W45': { score: 6 },
    });
    expect(setMode('rpg')).toEqual({ settings: { mode: 'rpg' } });
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
});
