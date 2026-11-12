import { LADDERS, markerFits } from './ladders';
import type { Journey, Stage } from './types/journey';
import { journeyErrors } from './validate';

/**
 * The journey checker (docs/authoring-journeys.md): everything about a
 * journey file that can be checked without a person. CI runs it on every
 * file in content/; a future import of private journeys runs the same
 * check. Errors block, warnings point at something a reviewer should look
 * at. The rules come from docs/psychology.md; each message names its rule.
 */

export interface Problem {
  readonly level: 'error' | 'warning';
  /** Where in the file, e.g. `stages[2].nugget` or `texts.de`. */
  readonly at: string;
  readonly message: string;
}

/** Longest text per field, so a station still reads well on a 360 px phone. */
export const TEXT_LIMITS = {
  title: 40,
  description: 160,
  why: 120,
  anchor: 40,
  action: 120,
  place: 40,
  guardian: 40,
  arrival: 200,
  accept: 200,
  nugget: 240,
  ending: 240,
  build: 40,
} as const;

type Field = keyof typeof TEXT_LIMITS;

interface Use {
  readonly key: string;
  readonly field: Field;
  readonly at: string;
}

/** Wording the design rules forbid, checked in the English texts. */
const BANNED: readonly { readonly pattern: RegExp; readonly message: string }[] = [
  {
    pattern: /\b\d+[\s-]*days?\b|\b(twenty-one|sixty-six)[\s-]+days?\b/i,
    message: 'promises or names a number of days; say "it varies a lot" instead (rule 4)',
  },
  {
    pattern: /\b(must|have to|has to|you should|no excuses?)\b/i,
    message: 'sounds controlling; use autonomy-supportive words like "you could" (rule 15)',
  },
  {
    pattern: /\b(fail(s|ed|ure|ing)?|lazy|guilt(y)?|break the chain)\b/i,
    message: 'blames the user; a miss is a neutral gap (rules 12 and 15)',
  },
  {
    pattern: /\bstreaks?\b/i,
    message: 'QuestArc counts runs that survive one miss, not streaks (rule 11)',
  },
  {
    pattern: /["“][^"”]{8,}["”]\s*[-–—]{1,2}\s*\p{Lu}/u,
    message: 'looks like a quote with an author; generic quotes are not used (rule 5)',
  },
];

/** First parts of the app's own text keys (content/i18n), so journey keys never clash. */
const RESERVED_IDS = new Set(['ui', 'event']);

const uses = (journey: Journey): Use[] => {
  const list: Use[] = [
    { key: journey.title, field: 'title', at: 'title' },
    { key: journey.description, field: 'description', at: 'description' },
  ];
  if (journey.why) list.push({ key: journey.why, field: 'why', at: 'why' });
  journey.stages.forEach((stage: Stage, i) => {
    const at = `stages[${i}]`;
    list.push({ key: stage.plan.anchor, field: 'anchor', at: `${at}.plan.anchor` });
    list.push({ key: stage.plan.action, field: 'action', at: `${at}.plan.action` });
    if (stage.plan.place)
      list.push({ key: stage.plan.place, field: 'place', at: `${at}.plan.place` });
    if (stage.guardian)
      list.push({ key: stage.guardian.name, field: 'guardian', at: `${at}.guardian.name` });
    if (stage.story?.arrival)
      list.push({ key: stage.story.arrival, field: 'arrival', at: `${at}.story.arrival` });
    if (stage.story?.accept)
      list.push({ key: stage.story.accept, field: 'accept', at: `${at}.story.accept` });
    if (stage.nugget) list.push({ key: stage.nugget, field: 'nugget', at: `${at}.nugget` });
  });
  if (journey.ending) list.push({ key: journey.ending.story, field: 'ending', at: 'ending.story' });
  journey.build?.names?.forEach((key, i) =>
    list.push({ key, field: 'build', at: `build.names[${i}]` }),
  );
  return list;
};

const error = (at: string, message: string): Problem => ({ level: 'error', at, message });
const warning = (at: string, message: string): Problem => ({ level: 'warning', at, message });

const textProblems = (journey: Journey, used: readonly Use[]): Problem[] => {
  const problems: Problem[] = [];
  const texts = journey.texts ?? {};
  const english = texts.en;
  if (!english) return [error('texts.en', 'English texts are required')];
  const usedKeys = new Set(used.map((u) => u.key));

  for (const { key, field, at } of used) {
    if (!key.startsWith(`${journey.id}.`))
      problems.push(error(at, `text key "${key}" must start with "${journey.id}."`));
    const text = english[key];
    if (text === undefined) {
      problems.push(error(at, `no English text for "${key}"`));
      continue;
    }
    for (const { pattern, message } of BANNED) {
      if (pattern.test(text)) problems.push(error(at, message));
    }
    for (const [lang, own] of Object.entries(texts)) {
      const value = own[key];
      if (value !== undefined && value.length > TEXT_LIMITS[field])
        problems.push(
          error(at, `${lang} text is longer than ${TEXT_LIMITS[field]} characters (360 px)`),
        );
    }
  }

  for (const [lang, own] of Object.entries(texts)) {
    for (const key of Object.keys(own)) {
      if (usedKeys.has(key)) continue;
      if (lang === 'en') problems.push(warning(`texts.en`, `"${key}" is not used`));
      else problems.push(error(`texts.${lang}`, `"${key}" is not a key of this journey`));
    }
  }
  return problems;
};

const stageProblems = (journey: Journey): Problem[] => {
  const problems: Problem[] = [];
  const english = journey.texts?.en ?? {};
  const anchor = (stage: Stage): string =>
    (english[stage.plan.anchor] ?? stage.plan.anchor).trim().toLowerCase();
  const first = journey.stages[0];
  const nuggets = new Map<string, number>();

  journey.stages.forEach((stage, i) => {
    const at = `stages[${i}]`;
    if (first && anchor(stage) !== anchor(first))
      problems.push(
        error(`${at}.plan.anchor`, 'every stage keeps the anchor of the first stage (rule 2)'),
      );
    const c = stage.condition;
    if (c.type === 'days' && c.of > 1 && c.n === c.of)
      problems.push(
        warning(`${at}.condition`, 'leaves no room for one missed day; e.g. 5 of 7 (rule 11)'),
      );
    if (c.type === 'days' && c.of > 14)
      problems.push(
        warning(`${at}.condition`, 'looks back more than two weeks; keep stages short (rule 1)'),
      );
    if (!stage.nugget) {
      problems.push(warning(`${at}.nugget`, 'each station could teach one technique (rule 22)'));
    } else {
      const text = (english[stage.nugget] ?? stage.nugget).trim();
      const seen = nuggets.get(text);
      if (seen !== undefined)
        problems.push(error(`${at}.nugget`, `same nugget as stages[${seen}] (rule 22)`));
      else nuggets.set(text, i);
    }
  });
  return problems;
};

/** What the journey builds (game rules §9), against content/ladders.json. */
const buildProblems = (journey: Journey): Problem[] => {
  const build = journey.build;
  if (!build) return [warning('build', 'name a ladder from content/ladders.json (issue #42)')];
  const ladder = Object.prototype.hasOwnProperty.call(LADDERS.ladders, build.ladder)
    ? LADDERS.ladders[build.ladder]
    : undefined;
  if (!ladder) {
    const known = Object.keys(LADDERS.ladders).join(', ');
    return [error('build.ladder', `"${build.ladder}" is not in content/ladders.json (${known})`)];
  }
  const problems: Problem[] = [];
  const versions = journey.stages.length + 1;
  if (build.marker !== undefined && !markerFits(build.marker, build.ladder)) {
    problems.push(
      error(
        'build.marker',
        Object.prototype.hasOwnProperty.call(LADDERS.markers, build.marker)
          ? `"${build.marker}" does not grow in the setting of "${build.ladder}" (water)`
          : `"${build.marker}" is not a marker in content/ladders.json`,
      ),
    );
  }
  if ((build.names?.length ?? 0) > versions)
    problems.push(error('build.names', `more names than the journey's ${versions} versions`));
  if (versions > ladder.versions)
    problems.push(
      warning(
        'build.ladder',
        `${journey.stages.length} stages need ${versions} versions, "${build.ladder}" has ${ladder.versions}; the last one gains fixed additions`,
      ),
    );
  return problems;
};

/** All problems of a journey file, errors first. An empty list means it passes. */
export const journeyProblems = (value: unknown): Problem[] => {
  const structural = journeyErrors(value);
  if (structural.length > 0) return structural.map((message) => error('', message));
  const journey = value as Journey;
  const used = uses(journey);
  const problems = [
    ...(RESERVED_IDS.has(journey.id)
      ? [error('id', `"${journey.id}" is reserved for app texts`)]
      : []),
    ...textProblems(journey, used),
    ...stageProblems(journey),
    ...buildProblems(journey),
    ...(journey.why ? [] : [warning('why', "asking for the user's own reason helps (rule 5)")]),
  ];
  return [
    ...problems.filter((p) => p.level === 'error'),
    ...problems.filter((p) => p.level === 'warning'),
  ];
};
