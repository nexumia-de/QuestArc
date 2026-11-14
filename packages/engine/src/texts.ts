import type { Journey } from './types/journey';

/**
 * Languages of the texts (docs/story-format.md, texts; issue #39). The
 * engine holds no texts: a host passes the tables of `content/i18n` and
 * the journeys, and gets the texts of one language with English behind
 * every key that language lacks. Pure, so the plugin, the standalone
 * app and Pensum (through the command line) choose alike.
 */

/** The language every text exists in, and the fallback for any other. */
export const FALLBACK_LANGUAGE = 'en';

/**
 * An action's second form for the plan sentence, where a language needs
 * one: German names a step "15 Minuten spazieren gehen" and plans "…
 * gehe ich 15 Minuten spazieren". The text stands under the action's
 * key with this ending.
 */
export const PLAN_FORM = '.plan';

export type TextTable = Readonly<Record<string, string>>;
export type TextTables = Readonly<Record<string, TextTable>>;

const own = <T>(tables: Readonly<Record<string, T>>, name: string): T | undefined =>
  Object.hasOwn(tables, name) ? tables[name] : undefined;

/**
 * The language to show for a host's locale ("de", "de-AT",
 * "de_DE.UTF-8"): the one of `available` with the same language part,
 * else English.
 */
export const pickLanguage = (locale: unknown, available: readonly string[]): string => {
  const wanted = typeof locale === 'string' ? locale.trim().replace(/[.@].*$/, '') : '';
  const [language = '', region = ''] = wanted.split(/[-_]/);
  const lower = language.toLowerCase();
  const exact = `${lower}-${region.toUpperCase()}`;
  return (
    available.find((name) => name === exact) ??
    available.find((name) => name === lower) ??
    FALLBACK_LANGUAGE
  );
};

/** The texts of one table set in `language`, English behind every missing key. */
export const textsIn = (tables: TextTables, language: string): TextTable => ({
  ...own(tables, FALLBACK_LANGUAGE),
  ...(language === FALLBACK_LANGUAGE ? {} : own(tables, language)),
});

/**
 * All texts a host shows in `language`: the app's own (`ui`, by
 * language) and each journey's, by key. Journey keys start with the
 * journey's id, so nothing clashes.
 */
export const textsFor = (
  language: string,
  ui: TextTables,
  journeys: readonly Journey[] = [],
): Record<string, string> =>
  Object.assign(
    {},
    textsIn(ui, language),
    ...journeys.map((j) => textsIn(j.texts ?? {}, language)),
  );

const PLACEHOLDER = /\{([a-z][a-z0-9-]*)\}/gi;

const placeholders = (text: string): string =>
  [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1] ?? ''))].sort().join(', ');

/**
 * What a translated table of app texts gets wrong against the English
 * one: a key it lacks, a key English does not have, an empty text, or
 * other placeholders than the English text (a `{name}` left out would
 * drop what the user is told, one too many would show braces).
 */
export const translationProblems = (english: TextTable, other: TextTable): string[] => {
  const problems: string[] = [];
  for (const [key, text] of Object.entries(english)) {
    const translated = own(other, key);
    if (translated === undefined) problems.push(`"${key}" is missing`);
    else if (translated.trim() === '') problems.push(`"${key}" is empty`);
    else if (placeholders(translated) !== placeholders(text))
      problems.push(
        `"${key}" has the placeholders {${placeholders(translated)}}, English has {${placeholders(text)}}`,
      );
  }
  for (const key of Object.keys(other))
    if (!Object.hasOwn(english, key)) problems.push(`"${key}" is not a key of the English texts`);
  return problems;
};
