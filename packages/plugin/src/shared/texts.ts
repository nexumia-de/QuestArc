import type { Journey } from '@questarc/engine';

import english from '../../../../content/i18n/en.json';

/**
 * UI and event texts from content/i18n plus each journey's own texts
 * (docs/story-format.md, texts). Journey keys start with the journey id,
 * so they never clash with the app's `ui.` and `event.` keys. Shared by
 * plugin.js and the view; Pensum reads the same files. German follows
 * with issue #39. The journeys' texts are added by whoever has the
 * journeys: plugin.js with its built-in ones (shared/content.ts), the
 * view with those of each state it receives, so the view does not carry
 * the journeys itself (Super Productivity 19.3.1 takes an index.html of
 * at most 100 KB, docs/super-productivity-facts.md §1).
 */

export type TextParams = Readonly<Record<string, string | number>>;

const texts: Record<string, string> = { ...english };

/** Adds the journeys' own texts. */
export const addJourneyTexts = (journeys: readonly Journey[]): void => {
  for (const journey of journeys) Object.assign(texts, journey.texts?.en ?? {});
};

export const hasText = (key: string): boolean => Object.hasOwn(texts, key);

/** The text for `key` with `{name}` placeholders filled; the key itself if unknown. */
export const t = (key: string, params: TextParams = {}): string =>
  (texts[key] ?? key).replace(/\{([a-z][a-z0-9-]*)\}/gi, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );
