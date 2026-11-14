import type { Journey, RunAnchor, Stage } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import '../src/shared/english';
import { anchorLabel, planAnchor, planSentence } from '../src/shared/plan';
import { addJourneyTexts } from '../src/shared/texts';
import { habitName } from '../src/ui/habit';

// The plan sentence in its forms (docs/behaviour.md, plan sentence).
const texts = {
  'j.anchor': 'lunch',
  'j.action': 'walk for 15 minutes',
  'j.place': 'in the park',
  'j.water': 'drink a glass of water',
};
const stage = (place?: string) =>
  ({ plan: { anchor: 'j.anchor', action: 'j.action', ...(place ? { place } : {}) } }) as Stage;
addJourneyTexts([
  {
    id: 'j',
    stages: [stage(), { id: 'water', plan: { anchor: 'j.anchor', action: 'j.water' } }],
    texts: { en: texts },
  } as unknown as Journey,
]);

describe('plan sentence', () => {
  it('names anchor, action and the place', () => {
    expect(planSentence(stage())).toBe('After lunch, I will walk for 15 minutes.');
    expect(planSentence(stage('j.place'))).toBe(
      'After lunch, I will walk for 15 minutes (in the park).',
    );
  });

  it("ends with what the user pairs it with, in the user's words", () => {
    expect(planSentence(stage(), 'my podcast')).toBe(
      'After lunch, I will walk for 15 minutes, with my podcast.',
    );
    expect(planSentence(stage('j.place'), 'my podcast')).toBe(
      'After lunch, I will walk for 15 minutes (in the park), with my podcast.',
    );
    expect(planSentence(stage(), '')).toBe('After lunch, I will walk for 15 minutes.');
  });
});

// The user's anchor stands in the plan (design rule 2, #96): a routine in
// their words, a fixed time, or the step the run follows (a chain).
describe("the plan with the user's anchor", () => {
  const routine: RunAnchor = { id: 'm1', kind: 'routine', words: 'my noon break' };
  const time: RunAnchor = { id: 'm2', kind: 'time', time: '12:30' };
  const chained: RunAnchor = {
    ...routine,
    after: { runId: 'r1', journeyId: 'j', stageId: 'water' },
  };

  it("takes the user's words instead of the journey's suggestion", () => {
    expect(planSentence(stage(), undefined, routine)).toBe(
      'After my noon break, I will walk for 15 minutes.',
    );
    expect(planSentence(stage('j.place'), 'my podcast', routine)).toBe(
      'After my noon break, I will walk for 15 minutes (in the park), with my podcast.',
    );
  });

  it('says "At" for a fixed time', () => {
    expect(planSentence(stage(), undefined, time)).toBe('At 12:30, I will walk for 15 minutes.');
    expect(planSentence(stage('j.place'), 'my podcast', time)).toBe(
      'At 12:30, I will walk for 15 minutes (in the park), with my podcast.',
    );
  });

  it('names the step a chained run follows', () => {
    expect(planSentence(stage(), undefined, chained)).toBe(
      'After I drink a glass of water, I will walk for 15 minutes.',
    );
    // A step of a journey that is not here: the anchor's own words stand.
    expect(
      planSentence(stage(), undefined, {
        ...routine,
        after: { runId: 'r1', journeyId: 'gone', stageId: 'x' },
      }),
    ).toBe('After my noon break, I will walk for 15 minutes.');
  });

  it('labels a moment and names the habit in a question the same way', () => {
    expect([routine, time, chained].map((a) => anchorLabel(planAnchor(a) as never))).toEqual([
      'After my noon break',
      'At 12:30',
      'After I drink a glass of water',
    ]);
    expect(habitName(stage())).toBe('"Walk for 15 minutes after lunch"');
    expect(habitName(stage(), routine)).toBe('"Walk for 15 minutes after my noon break"');
    expect(habitName(stage(), time)).toBe('"Walk for 15 minutes at 12:30"');
    expect(habitName(stage(), chained)).toBe(
      '"Walk for 15 minutes after I drink a glass of water"',
    );
  });
});
