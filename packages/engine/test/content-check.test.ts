import { describe, expect, it } from 'vitest';
import { journeyProblems, languageProblems } from '../src/content-check';

// The journey checker on a small journey that passes, and on one broken
// copy per rule (docs/authoring-journeys.md, what CI checks).
const good = () => ({
  format: 3,
  id: 'tea',
  version: 1,
  author: 'Sam',
  title: 'tea.title',
  description: 'tea.description',
  why: 'tea.why',
  anchor: { moment: 'tea.moment', example: 'tea.anchor' } as {
    moment: string;
    example: string;
    time?: string;
  },
  build: { ladder: 'home', names: ['tea.build.tent'] } as {
    ladder: string;
    marker?: string;
    names?: string[];
  },
  stages: [
    {
      id: 'cup',
      plan: { anchor: 'tea.anchor', action: 'tea.cup.action' },
      schedule: { type: 'daily' },
      condition: { type: 'days', n: 5, of: 7 },
      nugget: 'tea.cup.nugget',
    },
    {
      id: 'pot',
      plan: { anchor: 'tea.anchor', action: 'tea.pot.action' },
      schedule: { type: 'weekdays', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
      condition: { type: 'days', n: 4, of: 5 },
      nugget: 'tea.pot.nugget',
    },
  ],
  texts: {
    en: {
      'tea.title': 'A cup of tea',
      'tea.description': 'From one cup to a calm tea break.',
      'tea.why': 'Why do you want a tea break? In your own words.',
      'tea.anchor': 'lunch',
      'tea.moment': 'a moment around midday',
      'tea.cup.action': 'make a cup of tea',
      'tea.cup.nugget': 'You could put the kettle where you see it.',
      'tea.pot.action': 'make a pot of tea',
      'tea.pot.nugget': 'One missed day is fine; you could just come back the next day.',
      'tea.build.tent': 'A tea corner',
    },
    de: { 'tea.title': 'Eine Tasse Tee' },
  },
});

type Draft = ReturnType<typeof good> & Record<string, unknown>;
const errors = (change: (j: Draft) => void) => {
  const journey = good() as Draft;
  change(journey);
  return journeyProblems(journey).filter((p) => p.level === 'error');
};
const en = (j: Draft) => j.texts.en as Record<string, string>;
const stage = (j: Draft, i: number) => j.stages[i] as Draft['stages'][0];

describe('journey checker', () => {
  it('passes a good journey without problems', () => {
    expect(journeyProblems(good())).toEqual([]);
  });

  it('reports structural errors first', () => {
    expect(errors((j) => (j.stages = []))[0]?.message).toBe('stages: 2 to 12 required');
  });

  it('requires English texts', () => {
    expect(errors((j) => delete (j.texts as Record<string, unknown>).en)).toHaveLength(1);
  });

  it('finds a missing English text', () => {
    expect(errors((j) => delete en(j)['tea.pot.action'])[0]?.at).toBe('stages[1].plan.action');
  });

  it('keeps text keys inside the journey', () => {
    expect(
      errors((j) => {
        j.title = 'ui.app.name';
        en(j)['ui.app.name'] = 'QuestArc';
      })[0]?.message,
    ).toContain('must start with "tea."');
  });

  it('keeps the app text prefixes free', () => {
    const journey = JSON.parse(JSON.stringify(good()).replaceAll('tea', 'ui')) as unknown;
    expect(journeyProblems(journey)[0]?.message).toContain('reserved');
  });

  it('rejects keys in other languages that the journey does not have', () => {
    expect(errors((j) => ((j.texts.de as Record<string, string>)['tea.typo'] = 'x'))).toHaveLength(
      1,
    );
  });

  it('warns when the stages name different anchors (#96)', () => {
    const journey = good() as Draft;
    stage(journey, 1).plan.anchor = 'tea.other';
    en(journey)['tea.other'] = 'getting up';
    expect(journeyProblems(journey)).toEqual([
      expect.objectContaining({ level: 'warning', at: 'stages[1].plan.anchor' }),
    ]);
  });

  it('warns when the journey does not say what kind of moment it starts from (#96)', () => {
    const journey = good() as Draft;
    delete (journey as Record<string, unknown>).anchor;
    delete en(journey)['tea.moment'];
    expect(journeyProblems(journey)).toEqual([
      expect.objectContaining({ level: 'warning', at: 'anchor' }),
    ]);
  });

  it('checks the anchor hint: its texts and a time of day', () => {
    expect(errors((j) => delete en(j)['tea.moment'])[0]?.at).toBe('anchor.moment');
    expect(errors((j) => (j.anchor.time = '25:00'))[0]?.message).toBe('anchor: invalid');
    expect(errors((j) => (j.anchor.time = '21:30'))).toEqual([]);
  });

  it('limits text length for 360 px', () => {
    expect(errors((j) => (en(j)['tea.title'] = 'x'.repeat(41)))[0]?.message).toContain('40');
  });

  it.each([
    ['a day count', 'Most people need 21 days for this.', 'rule 4'],
    ['controlling words', 'You must drink it hot.', 'rule 15'],
    ['blame', 'If you failed yesterday, try again.', 'rules 12'],
    ['streaks', 'Keep your streak alive.', 'rule 11'],
    ['a quote', '"Tea is the cure for everything." — Someone Famous', 'rule 5'],
  ])('rejects %s', (_name, text, rule) => {
    expect(errors((j) => (en(j)['tea.cup.nugget'] = text))[0]?.message).toContain(rule);
  });

  // German word lists (issue #39): the same rules in the German texts.
  const de = (j: Draft) => j.texts.de as Record<string, string>;

  it.each([
    ['a day count', 'Die meisten brauchen dafür 21 Tage.', 'rule 4'],
    ['a day count in words', 'Nach einundzwanzig Tagen sitzt es.', 'rule 4'],
    ['"du musst"', 'Du musst ihn heiß trinken.', 'rule 15'],
    ['"du solltest"', 'Du solltest den Kessel bereitstellen.', 'rule 15'],
    ['"nicht vergessen"', 'Nicht vergessen: der Kessel.', 'rule 15'],
    ['"verpasst"', 'Wenn du gestern verpasst hast, fang neu an.', 'rules 12'],
    ['"versäumt"', 'Ein versäumter Tag ist nicht schlimm.', 'rules 12'],
    ['"Fehler"', 'Ein Fehler ist kein Beinbruch.', 'rules 12'],
    ['"Rückfall"', 'Nach einem Rückfall geht es weiter.', 'rules 12'],
    ['"zurückstufen"', 'Du könntest dich zurückstufen.', 'rules 12'],
    ['streaks', 'Halte deine Strähne am Leben.', 'rule 11'],
    ['a quote', '„Tee ist die Antwort auf fast alles.“ – Irgendwer Berühmtes', 'rule 5'],
  ])('rejects %s in German', (_name, text, rule) => {
    const found = errors((j) => (de(j)['tea.cup.nugget'] = text));
    expect(found).toHaveLength(1);
    expect(found[0]?.message).toContain(rule);
    expect(found[0]?.message).toContain('de text');
  });

  it('accepts the German words the design rules ask for', () => {
    expect(
      errors((j) => {
        de(j)['tea.cup.nugget'] =
          'Ein Tag Pause ist in Ordnung: eine Lücke, mehr nicht. Der kleinere Schritt zählt trotzdem.';
        de(j)['tea.pot.nugget'] =
          'Wenn du magst, könntest du für später vorplanen: „Wenn es spät wird, dann koche ich eine Tasse.“ Die Muße bleibt.';
      }),
    ).toEqual([]);
  });

  it('checks each language with its own list only', () => {
    expect(errors((j) => (de(j)['tea.cup.nugget'] = 'You must drink it hot.'))).toEqual([]);
    expect(errors((j) => (en(j)['tea.cup.nugget'] = 'Du musst ihn heiß trinken.'))).toEqual([]);
  });

  it('wants the German action in the form of the plan sentence too', () => {
    const found = errors((j) => (de(j)['tea.cup.action'] = 'eine Tasse Tee kochen'));
    expect(found.map((p) => p.at)).toEqual(['stages[0].plan.action.plan']);
    expect(
      errors((j) => {
        de(j)['tea.cup.action'] = 'eine Tasse Tee kochen';
        de(j)['tea.cup.action.plan'] = 'koche ich eine Tasse Tee';
      }),
    ).toEqual([]);
    expect(
      errors((j) => {
        de(j)['tea.cup.action'] = 'eine Tasse Tee kochen';
        de(j)['tea.cup.action.plan'] = 'du musst eine Tasse Tee kochen';
      })[0]?.message,
    ).toContain('rule 15');
    expect(
      errors((j) => {
        de(j)['tea.cup.action'] = 'eine Tasse Tee kochen';
        de(j)['tea.cup.action.plan'] = 'x'.repeat(121);
      })[0]?.message,
    ).toContain('120');
  });

  it('says what a built-in journey lacks in a language', () => {
    const journey = good() as Draft;
    expect(languageProblems(journey as never, ['en'])).toEqual([]);
    expect(languageProblems(journey as never, ['de']).map((p) => p.message)).toContain(
      'no de text for "tea.why"',
    );
    expect(languageProblems(journey as never, ['de'])).toHaveLength(9);
    expect(languageProblems(journey as never, ['fr'])).toEqual([
      { level: 'error', at: 'texts.fr', message: 'no fr texts' },
    ]);
  });

  it('rejects the same nugget twice', () => {
    expect(
      errors((j) => (en(j)['tea.pot.nugget'] = 'You could put the kettle where you see it.')),
    ).toHaveLength(1);
  });

  it('refuses a guardian (issue #110)', () => {
    const found = errors(
      (j) =>
        ((stage(j, 1) as Record<string, unknown>).guardian = { name: 'tea.pot.nugget', hp: 100 }),
    );
    expect(found.map((p) => p.at)).toEqual(['stages[1].guardian']);
  });

  it('warns about a condition without room for one miss, a missing nugget and why', () => {
    const journey = good() as Draft;
    stage(journey, 0).condition = { type: 'days', n: 7, of: 7 };
    delete (journey.stages[1] as { nugget?: string }).nugget;
    delete (journey as { why?: string }).why;
    delete en(journey)['tea.why'];
    delete en(journey)['tea.pot.nugget'];
    const problems = journeyProblems(journey);
    expect(problems.every((p) => p.level === 'warning')).toBe(true);
    expect(problems.map((p) => p.at)).toEqual(['stages[0].condition', 'stages[1].nugget', 'why']);
  });

  it('warns when a user who skips the first stage would start at a large step (#81)', () => {
    const at = (action: string, condition?: object) => {
      const journey = good() as Draft;
      en(journey)['tea.pot.action'] = action;
      if (condition) (stage(journey, 1) as { condition: object }).condition = condition;
      return journeyProblems(journey).map((p) => [p.level, p.at]);
    };
    expect(at('make tea and sit with it for 15 quiet minutes')).toEqual([
      ['warning', 'stages[1].plan.action'],
    ]);
    expect(at('make tea and sit with it for fifteen minutes')).toHaveLength(1);
    expect(at('make a pot of tea', { type: 'time_spent', minutes: 20 })).toHaveLength(1);
    expect(at('make tea and sit with it for five minutes')).toEqual([]);
    expect(at('make tea and sit for 1 minute')).toEqual([]);
  });

  it('checks the build against content/art/', () => {
    expect(errors((j) => (j.build = { ladder: 'castle' }))[0]?.message).toContain('castle');
    expect(errors((j) => (j.build.marker = 'balloons'))[0]?.message).toContain('not a marker');
    expect(errors((j) => (j.build.marker = 'flowers'))).toEqual([]);
    expect(
      errors((j) => (j.build = { ladder: 'crossing', marker: 'flowers' }))[0]?.message,
    ).toContain('water');
    expect(errors((j) => (j.build = { ladder: 'crossing', marker: 'lanterns' }))).toEqual([]);
    expect(errors((j) => (j.build = { ladder: 'Home' }))[0]?.message).toBe('build: invalid');
  });

  it('allows a name per version, each in the journey texts and short', () => {
    const names = (j: Draft, n: number) => {
      j.build.names = Array.from({ length: n }, (_, i) => `tea.build.v${i}`);
      j.build.names.forEach((key) => (en(j)[key] = 'A tea corner'));
    };
    expect(errors((j) => names(j, 3))).toEqual([]);
    expect(errors((j) => names(j, 4))[0]?.at).toBe('build.names');
    expect(errors((j) => (en(j)['tea.build.tent'] = 'x'.repeat(41)))[0]?.message).toContain('40');
    expect(errors((j) => delete en(j)['tea.build.tent'])[0]?.at).toBe('build.names[0]');
  });

  it('warns about a journey without build and one with more stages than the ladder has versions', () => {
    const plain = good() as Draft;
    delete (plain as { build?: unknown }).build;
    delete en(plain)['tea.build.tent'];
    expect(journeyProblems(plain).map((p) => [p.level, p.at])).toEqual([['warning', 'build']]);

    const long = good() as Draft;
    const extra = { ...stage(long, 1), nugget: undefined };
    long.stages = [0, 1, 2, 3, 4].map((i) => ({ ...extra, id: `s${i}`, nugget: `tea.n${i}` }));
    long.stages.forEach((s) => (en(long)[s.nugget as string] = `You could try idea ${s.id}.`));
    delete en(long)['tea.cup.nugget'];
    delete en(long)['tea.pot.nugget'];
    delete en(long)['tea.cup.action'];
    const problems = journeyProblems(long);
    expect(problems.map((p) => [p.level, p.at])).toEqual([['warning', 'build.ladder']]);
    expect(problems[0]?.message).toContain('6 versions');
  });
});
