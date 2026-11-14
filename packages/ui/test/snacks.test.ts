import { evaluate } from '@questarc/engine';
import type { GameEvent, GameView } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import { messageFor, snackFor } from '../src/adapter/snacks';
import { builtInJourneys } from '../src/shared/content';

// A view with the first gentle-morning stage current, 4 of 5 days done.
const view = (): GameView => {
  const days = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'];
  return evaluate({
    day: { todayStr: '2026-10-30', startOfNextDayDiffMs: 0, timeZone: 'UTC' },
    tasks: days.map((day) => ({
      id: `rpt_c_${day}`,
      isDone: true,
      doneOn: Date.parse(`${day}T08:00:00Z`),
      repeatCfgId: 'c',
      created: Date.parse(`${day}T12:00:00Z`),
    })),
    repeatCfgs: [
      { id: 'c', isPaused: false, repeatCycle: 'DAILY', repeatEvery: 1, startDate: '2026-10-27' },
    ],
    choices: {
      'run:r': { journeyId: 'gentle-morning', journeyVersion: 1, startDay: '2026-10-27' },
      'stage:r:water': { acceptedDay: '2026-10-27' },
      'binding:r:water': { taskId: 'rpt_c_2026-10-27', repeatCfgId: 'c' },
    },
    journeys: builtInJourneys,
  });
};

const ev = (key: string, params: GameEvent['params'] = {}): GameEvent => ({ key, params });

describe('messages after a completion (behaviour, flow A)', () => {
  it('names the habit and the real progress in words', () => {
    expect(messageFor([ev('event.completion')], view(), builtInJourneys)).toBe(
      'Drink a glass of water: done. 4 of 5 days.',
    );
  });

  it('greets coming back', () => {
    expect(messageFor([ev('event.welcome-back')], view(), builtInJourneys)).toBe(
      'Welcome back. Your run goes on.',
    );
  });

  it('joins several events into one message', () => {
    expect(
      messageFor(
        [ev('event.completion'), ev('event.station-reached', { stage: 'water' })],
        view(),
        builtInJourneys,
      ),
    ).toBe('Drink a glass of water: done. 4 of 5 days. Station reached: you can continue.');
  });

  it('has a text for every progress event the engine emits', () => {
    for (const key of [
      'event.completion',
      'event.welcome-back',
      'event.progress-summary',
      'event.station-reached',
    ]) {
      expect(messageFor([ev(key, { completions: 2 })], view(), builtInJourneys)).toBeTruthy();
    }
  });
});

describe('the message opens the build (#100)', () => {
  const show = () => undefined;

  it('offers the action Show', () => {
    expect(snackFor([ev('event.completion')], view(), builtInJourneys, show)).toEqual({
      msg: 'Drink a glass of water: done. 4 of 5 days.',
      type: 'SUCCESS',
      ico: 'route',
      action: { label: 'Show', onClick: show },
    });
  });

  it('build events alone make no message: it never says what was added', () => {
    const quiet = [
      ev('event.build-element', { from: 0.6, to: 0.8 }),
      ev('event.build-version', { version: 4 }),
    ];
    expect(snackFor(quiet, view(), builtInJourneys, show)).toBeUndefined();
  });
});
