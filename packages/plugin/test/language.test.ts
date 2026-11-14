import type { RunAnchor, Stage } from '@questarc/engine';
import { afterEach, describe, expect, it } from 'vitest';

import german from '../../../content/i18n/de.json';
import english from '../../../content/i18n/en.json';
import crossingFile from '../../../content/art/crossing.ladder.json';
import { artPack, artPackIn } from '@questarc/ui/adapter/art-pack';
import { createBrain } from '@questarc/ui/adapter/brain';
import { contentPack } from '../src/adapter/content-pack';
import { followLanguage } from '../src/adapter/language';
import { handleMessage } from '../src/adapter/messages';
import { builtInJourneys } from '@questarc/ui/shared/content';
import { useLanguage } from '@questarc/ui/shared/languages';
import { anchorLabel, planAnchor, planSentence, taskAnchor } from '@questarc/ui/shared/plan';
import type { State } from '@questarc/ui/shared/protocol';
import { language, t } from '@questarc/ui/shared/texts';
import { habitName } from '@questarc/ui/ui/habit';
import { shortDate, weekdayOfId } from '@questarc/ui/ui/journey/format';
import { buildSummary } from '@questarc/ui/ui/journey/build-choice';
import { buildLabel, buildWords, type Ladder } from '@questarc/ui/ui/ladder';
import { setArt } from '@questarc/ui/ui/art-store';
import { createFakeHost } from '@questarc/ui/testing/fake-host';

// German texts (issue #39): the language follows Super Productivity's,
// English stands for any other language, and the sentences that take
// the user's own words are built the German way.
const walk = builtInJourneys.find((j) => j.id === 'walk-after-lunch');
const morning = builtInJourneys.find((j) => j.id === 'gentle-morning');
const stageOf = (journey: typeof walk, id: string): Stage =>
  journey?.stages.find((s) => s.id === id) as Stage;

afterEach(() => {
  useLanguage('en', builtInJourneys);
});

describe("Super Productivity's language", () => {
  const host = (code?: unknown) => {
    const hooks = new Map<string, (payload?: unknown) => void>();
    return {
      hooks,
      api: {
        ...(code === undefined ? {} : { getCurrentLanguage: () => code as string }),
        registerHook: (hook: string, handler: (payload?: unknown) => void) => {
          hooks.set(hook, handler);
        },
      } as never,
    };
  };

  it.each([
    ['de', 'de'],
    ['de-AT', 'de'],
    ['en', 'en'],
    ['fr', 'en'],
    ['zh_tw', 'en'],
    [undefined, 'en'],
  ])('%s at start shows %s', (code, shown) => {
    followLanguage(host(code).api, builtInJourneys);
    expect(language()).toBe(shown);
    expect(t('ui.action.back')).toBe(shown === 'de' ? 'Zurück' : 'Back');
  });

  it('follows the hook languageChange and tells only a real change', () => {
    const { api, hooks } = host('en');
    let changes = 0;
    followLanguage(api, builtInJourneys, () => (changes += 1));
    hooks.get('languageChange')?.({ code: 'de', newLanguage: 'de' });
    expect(language()).toBe('de');
    expect(t(walk?.title ?? '')).toBe('Ein Spaziergang nach dem Mittagessen');
    hooks.get('languageChange')?.({ code: 'de', newLanguage: 'de' });
    hooks.get('languageChange')?.({ code: 'fr', newLanguage: 'fr' });
    expect(language()).toBe('en');
    expect(t(walk?.title ?? '')).toBe('A walk after lunch');
    hooks.get('languageChange')?.({ code: 'es', newLanguage: 'es' });
    expect(changes).toBe(2);
  });

  it('stays English on a host that has neither the method nor the hook', () => {
    followLanguage(
      {
        getCurrentLanguage: () => {
          throw new Error('not here');
        },
        registerHook: () => {
          throw new Error('Unknown hook: languageChange');
        },
      } as never,
      builtInJourneys,
    );
    expect(language()).toBe('en');
  });

  it('sends the view the texts of the language and names it with every state', async () => {
    const brain = createBrain({
      api: createFakeHost().api,
      journeys: builtInJourneys,
      onEvents: () => undefined,
    });
    useLanguage('de', builtInJourneys);
    expect(contentPack().language).toBe('de');
    expect(contentPack().texts).toEqual(german);
    expect(contentPack().art.ladders.home?.versions[2]?.title).toBe('Eine Hütte');
    expect(contentPack().art.markers.bunting?.title).toBe('Wimpel');
    expect(contentPack().art.palette.meadow?.title).toBe('Wiesengrün');
    const state = (await handleMessage(brain, { type: 'questarc:get' })) as State;
    expect(state.language).toBe('de');
    useLanguage('pt-BR', builtInJourneys);
    expect(contentPack().texts).toEqual(english);
    expect(((await handleMessage(brain, { type: 'questarc:get' })) as State).language).toBe('en');
    brain.stop();
  });

  it('keeps the English art titles in content/i18n equal to content/art', () => {
    expect(artPackIn()).toEqual(artPack);
    const all: Record<string, string> = english;
    for (const [name, ladder] of Object.entries(artPack.ladders)) {
      expect(all[`ui.art.ladder.${name}`]).toBe(ladder.title);
      ladder.versions.forEach((v, i) =>
        expect(all[`ui.art.ladder.${name}.${i + 1}`]).toBe(v.title),
      );
    }
    for (const [name, marker] of Object.entries(artPack.markers))
      expect(all[`ui.art.marker.${name}`]).toBe(marker.title);
    for (const [name, hue] of Object.entries(artPack.palette))
      expect(all[`ui.art.hue.${name}`]).toBe(hue.title);
  });
});

describe('German sentences', () => {
  const routine: RunAnchor = { id: 'm1', kind: 'routine', words: 'meiner Mittagspause' };
  const time: RunAnchor = { id: 'm2', kind: 'time', time: '12:30' };
  const chained: RunAnchor = {
    ...routine,
    after: { runId: 'r1', journeyId: 'gentle-morning', stageId: 'water' },
  };
  const walk10 = () => stageOf(walk, 'walk-10');
  const water = () => stageOf(morning, 'water');

  it('puts the verb second in the plan, with place and pairing', () => {
    useLanguage('de', builtInJourneys);
    expect(planSentence(walk10())).toBe(
      'Nach dem Mittagessen gehe ich 10 Minuten in gemütlichem Tempo spazieren.',
    );
    expect(planSentence(walk10(), 'meinem Podcast', routine)).toBe(
      'Nach meiner Mittagspause gehe ich 10 Minuten in gemütlichem Tempo spazieren, mit meinem Podcast.',
    );
    expect(planSentence(water())).toBe(
      'Nach dem Aufstehen trinke ich ein Glas Wasser (in der Küche).',
    );
    expect(planSentence(water(), 'Musik', time)).toBe(
      'Um 12:30 Uhr trinke ich ein Glas Wasser (in der Küche), mit Musik.',
    );
    expect(planSentence(walk10(), undefined, chained)).toBe(
      'Nach „ein Glas Wasser trinken“ gehe ich 10 Minuten in gemütlichem Tempo spazieren.',
    );
  });

  it('leaves the English plan as it was', () => {
    expect(planSentence(walk10())).toBe('After lunch, I will walk for 10 minutes at an easy pace.');
    expect(planSentence(water(), 'music', time)).toBe(
      'At 12:30, I will drink a glass of water (in the kitchen), with music.',
    );
  });

  it('names a step by its infinitive and the moment by "Nach …"', () => {
    useLanguage('de', builtInJourneys);
    expect(t(walk10().plan.action)).toBe('10 Minuten in gemütlichem Tempo spazieren gehen');
    expect(anchorLabel(planAnchor(routine) ?? { form: 'after', text: '' })).toBe(
      'Nach meiner Mittagspause',
    );
    expect(anchorLabel(planAnchor(time) ?? { form: 'after', text: '' })).toBe('Um 12:30 Uhr');
    expect(habitName(walk10(), routine)).toBe(
      '„10 Minuten in gemütlichem Tempo spazieren gehen nach meiner Mittagspause“',
    );
    expect(t('ui.checkin.question', { habit: habitName(water()) })).toBe(
      '„Ein Glas Wasser trinken nach dem Aufstehen“ ist etwas, das ich automatisch tue.',
    );
  });

  it("starts a task's title with the moment as each language says it", () => {
    expect(taskAnchor(undefined, 'lunch')).toBe('Lunch');
    expect(taskAnchor(planAnchor(time), 'lunch')).toBe('12:30');
    expect(taskAnchor(planAnchor(chained), 'lunch')).toBe('Drink a glass of water');
    useLanguage('de', builtInJourneys);
    expect(taskAnchor(undefined, 'dem Mittagessen')).toBe('Nach dem Mittagessen');
    expect(taskAnchor(planAnchor(routine), 'x')).toBe('Nach meiner Mittagspause');
    expect(taskAnchor(planAnchor(time), 'x')).toBe('12:30 Uhr');
    expect(taskAnchor(planAnchor(chained), 'x')).toBe('Nach „ein Glas Wasser trinken“');
  });

  it('writes dates and weekdays as the language does', () => {
    expect(shortDate('2026-11-09')).toBe('9 Nov');
    expect(weekdayOfId('wed')).toBe('Wednesday');
    useLanguage('de', builtInJourneys);
    expect(shortDate('2026-11-09')).toBe('9. Nov.');
    expect(weekdayOfId('wed')).toBe('Mittwoch');
  });

  it('says what stands, with German nouns left as they are', () => {
    useLanguage('de', builtInJourneys);
    setArt(artPackIn());
    const crossing = artPackIn().ladders.crossing as Ladder;
    expect(buildWords(crossing, 1, { progress: 0.5 })).toBe(
      'Trittsteine stehen · ein Baumstamm entsteht',
    );
    expect(buildWords(crossing, 3, { ready: true })).toBe(
      'Eine Bretterbrücke steht · eine Steinbrücke ist bereit',
    );
    expect(buildWords(crossing, 5, { progress: 1 })).toBe('Eine überdachte Brücke steht');
    expect(buildLabel(crossing, 3, { progress: 5 / 8 }, 'Laternen')).toBe(
      'Eine Bretterbrücke, Stufe 3 von 5; Schmuck: 2 von 2 Pfosten und 3 von 6 Laternen; noch nicht bereit',
    );
    expect(buildSummary(walk as never, {})).toBe('Übergang · Laternen · Wasserblau');
  });

  it('keeps the English build words', () => {
    setArt(artPackIn());
    const crossing = crossingFile as unknown as Ladder;
    expect(buildWords(crossing, 1, { progress: 0.5 })).toBe(
      'Stepping stones stand · a log is on its way',
    );
    expect(buildSummary(walk as never, {})).toBe('Crossing · lanterns · water blue');
  });
});
