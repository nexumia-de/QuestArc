import { evaluate } from '@questarc/engine';
import type { GameEvent, GameView } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import { messageFor, snackFor } from '../src/adapter/snacks';
import { builtInJourneys } from '../src/shared/content';

// A view with the first gentle-morning stage current, 4 of 5 days done.
const view = (mode: 'calm' | 'rpg'): GameView => {
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
      settings: { mode },
      'run:r': { journeyId: 'gentle-morning', journeyVersion: 1, startDay: '2026-10-27' },
      'stage:r:water': { acceptedDay: '2026-10-27' },
      'binding:r:water': { taskId: 'rpt_c_2026-10-27', repeatCfgId: 'c' },
    },
    journeys: builtInJourneys,
  });
};

const ev = (key: string, params: GameEvent['params'] = {}): GameEvent => ({ key, params });

describe('messages after a completion (behaviour, flow A)', () => {
  it('calm: names the habit and the progress, no game words', () => {
    expect(messageFor([ev('event.completion', { xp: 10 })], view('calm'), builtInJourneys)).toBe(
      'Drink a glass of water: done. 4 of 5 days.',
    );
  });

  it('with game: XP after it was earned', () => {
    expect(messageFor([ev('event.completion', { xp: 10 })], view('rpg'), builtInJourneys)).toBe(
      '+10 XP · 4 of 5 days.',
    );
  });

  it('welcome back, with the guardian when it was hit', () => {
    expect(messageFor([ev('event.welcome-back', { xp: 20 })], view('calm'), builtInJourneys)).toBe(
      'Welcome back. Your run goes on.',
    );
    expect(
      messageFor(
        [ev('event.welcome-back', { xp: 20 }), ev('event.guardian-damaged', { damage: 20 })],
        view('rpg'),
        builtInJourneys,
      ),
    ).toBe('Welcome back! +20 XP, the guardian staggers.');
  });

  it('joins several events into one message', () => {
    expect(
      messageFor(
        [
          ev('event.completion', { xp: 10 }),
          ev('event.station-reached'),
          ev('event.level-up', { level: 2 }),
        ],
        view('rpg'),
        builtInJourneys,
      ),
    ).toBe('+10 XP · 4 of 5 days. Station reached: you can continue. Level 2.');
  });

  it('calm mode shows no guardian and no level', () => {
    expect(
      messageFor(
        [ev('event.guardian-defeated'), ev('event.level-up', { level: 2 })],
        view('calm'),
        builtInJourneys,
      ),
    ).toBeUndefined();
  });

  it('has a text, in at least one mode, for every event the engine emits', () => {
    const keys = [
      'event.completion',
      'event.welcome-back',
      'event.progress-summary',
      'event.station-reached',
      'event.guardian-defeated',
      'event.level-up',
    ];
    for (const key of keys) {
      expect(
        messageFor([ev(key, { xp: 10, completions: 2, level: 2 })], view('rpg'), builtInJourneys),
      ).toBeTruthy();
    }
  });
});

describe('the message opens the build in game mode (#100)', () => {
  const show = () => undefined;
  const events = [ev('event.completion', { xp: 10 })];

  it('game mode with a build: the action Show', () => {
    const snack = snackFor(events, view('rpg'), builtInJourneys, show);
    expect(snack?.msg).toBe('+10 XP · 4 of 5 days.');
    expect(snack?.action?.label).toBe('Show');
    expect(snack?.action?.onClick).toBe(show);
  });

  it('calm mode: the same message as before, without an action', () => {
    expect(snackFor(events, view('calm'), builtInJourneys, show)).toEqual({
      msg: 'Drink a glass of water: done. 4 of 5 days.',
      type: 'SUCCESS',
      ico: 'route',
    });
  });

  it('build events alone make no message (no words for in-between elements)', () => {
    const quiet = [
      ev('event.build-element', { from: 0.6, to: 0.8 }),
      ev('event.build-version', { version: 4 }),
    ];
    expect(snackFor(quiet, view('rpg'), builtInJourneys, show)).toBeUndefined();
  });
});
