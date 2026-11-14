import { describe, expect, it } from 'vitest';

import { pickLanguage, textsFor, textsIn, translationProblems } from '../src/texts';
import type { Journey } from '../src/types/journey';

// Languages (issue #39): the host's locale picks one, English stands
// behind every missing key, and a translated table is checked against
// the English one.
describe('pickLanguage', () => {
  const available = ['en', 'de', 'pt-BR'];

  it.each([
    ['de', 'de'],
    ['de-AT', 'de'],
    ['de_DE.UTF-8', 'de'],
    ['DE', 'de'],
    ['pt-BR', 'pt-BR'],
    ['pt_br', 'pt-BR'],
    ['en-GB', 'en'],
  ])('%s shows %s', (locale, language) => {
    expect(pickLanguage(locale, available)).toBe(language);
  });

  it.each([['fr'], ['pt'], ['zh_tw'], [''], [undefined], [7], ['C']])(
    '%s falls back to English',
    (locale) => {
      expect(pickLanguage(locale, available)).toBe('en');
    },
  );
});

describe('texts in a language', () => {
  const ui = { en: { 'ui.a': 'A', 'ui.b': 'B' }, de: { 'ui.a': 'Ä' } };
  const journey = {
    id: 'tea',
    texts: { en: { 'tea.title': 'Tea', 'tea.why': 'Why?' }, de: { 'tea.title': 'Tee' } },
  } as unknown as Journey;

  it('falls back to English key by key', () => {
    expect(textsIn(ui, 'de')).toEqual({ 'ui.a': 'Ä', 'ui.b': 'B' });
    expect(textsIn(ui, 'fr')).toEqual(ui.en);
    expect(textsIn(ui, 'constructor')).toEqual(ui.en);
  });

  it('joins the app texts and the journeys', () => {
    expect(textsFor('de', ui, [journey])).toEqual({
      'ui.a': 'Ä',
      'ui.b': 'B',
      'tea.title': 'Tee',
      'tea.why': 'Why?',
    });
    expect(textsFor('en', ui, [journey])['tea.title']).toBe('Tea');
    expect(textsFor('de', ui)).toEqual({ 'ui.a': 'Ä', 'ui.b': 'B' });
  });
});

describe('translationProblems', () => {
  const english = { 'ui.a': 'Station {n} of {total}', 'ui.b': 'Back' };

  it('passes a complete table, whatever the order of the placeholders', () => {
    expect(translationProblems(english, { 'ui.a': 'Von {total}: {n}', 'ui.b': 'Zurück' })).toEqual(
      [],
    );
  });

  it('finds a missing, an empty and an unknown key', () => {
    expect(translationProblems(english, { 'ui.a': 'Station {n} von {total}' })).toEqual([
      '"ui.b" is missing',
    ]);
    expect(
      translationProblems(english, { 'ui.a': 'Station {n} von {total}', 'ui.b': ' ' }),
    ).toEqual(['"ui.b" is empty']);
    expect(
      translationProblems(english, { ...english, 'ui.c': 'x' }).map((p) => p.slice(0, 6)),
    ).toEqual(['"ui.c"']);
  });

  it('finds a placeholder left out or made up', () => {
    expect(translationProblems(english, { 'ui.a': 'Station {n}', 'ui.b': 'Zurück' })).toEqual([
      '"ui.a" has the placeholders {n}, English has {n, total}',
    ]);
    expect(
      translationProblems(english, { 'ui.a': 'Station {n} von {total}', 'ui.b': '{x}' }),
    ).toHaveLength(1);
  });
});
