import { describe, expect, it } from 'vitest';

import { builtInJourneys } from '../src/shared/content';
import { hasText, t } from '../src/shared/texts';

// A new journey is one new file in content/journeys/: the plugin finds it
// and its texts without any other change (docs/authoring-journeys.md).
describe('built-in journeys', () => {
  it('are found in content/journeys/ in file-name order', () => {
    const ids = builtInJourneys.map((j) => j.id);
    expect(ids).toEqual(expect.arrayContaining(['first-things-first', 'gentle-morning']));
    expect(ids).toEqual([...ids].sort());
  });

  it('bring their own English texts', () => {
    for (const journey of builtInJourneys) {
      expect(hasText(journey.title)).toBe(true);
      expect(t(journey.title)).toBe(journey.texts?.en?.[journey.title]);
    }
  });

  it('fill the author line', () => {
    expect(t('ui.journey.author', { name: 'Sam' })).toBe('Written by Sam');
  });
});
