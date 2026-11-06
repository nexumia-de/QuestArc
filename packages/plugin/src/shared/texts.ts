import english from '../../../../content/i18n/en.json';
import { builtInJourneys } from './content';

/**
 * UI and event texts from content/i18n plus each journey's own texts
 * (docs/story-format.md, texts). Journey keys start with the journey id,
 * so they never clash with the app's `ui.` and `event.` keys. Shared by
 * plugin.js and the view; Pensum reads the same files. German follows
 * with issue #39.
 */

export type TextParams = Readonly<Record<string, string | number>>;

const texts: Readonly<Record<string, string>> = Object.assign(
  {},
  english,
  ...builtInJourneys.map((journey) => journey.texts?.en ?? {}),
);

export const hasText = (key: string): boolean => Object.hasOwn(texts, key);

/** The text for `key` with `{name}` placeholders filled; the key itself if unknown. */
export const t = (key: string, params: TextParams = {}): string =>
  (texts[key] ?? key).replace(/\{([a-z][a-z0-9-]*)\}/gi, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );
