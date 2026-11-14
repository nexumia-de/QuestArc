import type { Journey } from '@questarc/engine';

/**
 * UI and event texts from content/i18n plus each journey's own texts
 * (docs/story-format.md, texts). Journey keys start with the journey id,
 * so they never clash with the app's `ui.` and `event.` keys. Shared by
 * plugin.js and the view; Pensum reads the same files. German follows
 * with issue #39. This module holds no texts itself: plugin.js adds
 * content/i18n/en.json (shared/english.ts) and its built-in journeys'
 * texts (shared/content.ts); the view adds the few texts of its start
 * state, then what plugin.js sends (`questarc:content`) and the journeys
 * of each state. So the view carries neither (Super Productivity 19.3.1
 * takes an index.html of at most 100 KB,
 * docs/decisions/one-build-for-older-versions.md).
 */

export type TextParams = Readonly<Record<string, string | number>>;

const texts: Record<string, string> = {};
/** `<journeyId>:<stageId>` → the text key of the stage's action, for a chained plan (#96). */
const actions: Record<string, string> = {};

/** Adds texts by key. */
export const addTexts = (more: Readonly<Record<string, string>>): void => {
  Object.assign(texts, more);
};

/** Adds the journeys' own texts. */
export const addJourneyTexts = (journeys: readonly Journey[]): void => {
  for (const journey of journeys) {
    addTexts(journey.texts?.en ?? {});
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
