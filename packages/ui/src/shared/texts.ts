import { FALLBACK_LANGUAGE, PLAN_FORM, textsIn, type Journey } from '@questarc/engine';

/**
 * UI and event texts from content/i18n plus each journey's own texts
 * (docs/story-format.md, texts), in one language at a time with English
 * behind every missing key (issue #39). Journey keys start with the
 * journey id, so they never clash with the app's `ui.` and `event.`
 * keys. Shared by plugin.js and the view; Pensum reads the same files.
 * This module holds no texts itself: plugin.js adds the tables of
 * content/i18n (shared/languages.ts) and its built-in journeys' texts
 * (shared/content.ts); the view adds the few texts of its start state,
 * then what plugin.js sends (`questarc:content`) and the journeys of
 * each state. So the view carries neither (Super Productivity 19.3.1
 * takes an index.html of at most 100 KB,
 * docs/decisions/one-build-for-older-versions.md).
 */

export type TextParams = Readonly<Record<string, string | number>>;

let current = FALLBACK_LANGUAGE;
let texts: Record<string, string> = {};
/** `<journeyId>:<stageId>` → the text key of the stage's action, for a chained plan (#96). */
const actions: Record<string, string> = {};

/** The language of the texts held now: "en" or "de". */
export const language = (): string => current;

/**
 * Starts over in `next` with the app's texts in that language; the
 * journeys' texts are added again after it (addJourneyTexts).
 */
export const setLanguage = (next: string, ui: Readonly<Record<string, string>>): void => {
  current = next;
  texts = { ...ui };
};

/** Adds texts by key. */
export const addTexts = (more: Readonly<Record<string, string>>): void => {
  Object.assign(texts, more);
};

/** Adds the journeys' own texts in the current language. */
export const addJourneyTexts = (journeys: readonly Journey[]): void => {
  for (const journey of journeys) {
    addTexts(textsIn(journey.texts ?? {}, current));
    for (const stage of journey.stages) actions[`${journey.id}:${stage.id}`] = stage.plan.action;
  }
};

/** The action of a journey's stage in words, if the journey is known. */
export const stageAction = (journeyId: string, stageId: string): string | undefined => {
  const key = actions[`${journeyId}:${stageId}`];
  return key === undefined ? undefined : t(key);
};

export const hasText = (key: string): boolean => Object.hasOwn(texts, key);

/** The text for `key` with `{name}` placeholders filled; the key itself if unknown. */
export const t = (key: string, params: TextParams = {}): string =>
  (texts[key] ?? key).replace(/\{([a-z][a-z0-9-]*)\}/gi, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );

/**
 * An action as the plan sentence says it: German plans "… gehe ich 15
 * Minuten spazieren" and names the step "15 Minuten spazieren gehen",
 * so its journeys give the second form under `<key>.plan`
 * (docs/story-format.md, texts). Without one the name stands.
 */
export const planAction = (key: string): string =>
  t(hasText(key + PLAN_FORM) ? key + PLAN_FORM : key);

/** The first letter lowered where the language writes a title so in the middle of a line. */
export const inLine = (title: string): string =>
  new RegExp(t('ui.grammar.lower')).test(title)
    ? title.charAt(0).toLowerCase() + title.slice(1)
    : title;
