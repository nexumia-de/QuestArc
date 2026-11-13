import type { Stage } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import { planSentence } from '../src/shared/plan';
import { addJourneyTexts } from '../src/shared/texts';

// The plan sentence in its four forms (docs/behaviour.md, plan sentence).
const texts = { 'j.anchor': 'lunch', 'j.action': 'walk for 15 minutes', 'j.place': 'in the park' };
addJourneyTexts([{ texts: { en: texts } } as never]);
const stage = (place?: string) =>
  ({ plan: { anchor: 'j.anchor', action: 'j.action', ...(place ? { place } : {}) } }) as Stage;

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
