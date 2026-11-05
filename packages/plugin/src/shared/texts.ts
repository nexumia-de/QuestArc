import english from '../../../../content/i18n/en.json';

/**
 * UI, event and journey texts from content/i18n (docs/story-format.md,
 * texts). Shared by plugin.js and the view; Pensum reads the same files.
 * German follows with issue #39.
 */

export type TextParams = Readonly<Record<string, string | number>>;

const texts: Readonly<Record<string, string>> = english;

export const hasText = (key: string): boolean => Object.hasOwn(texts, key);

/** The text for `key` with `{name}` placeholders filled; the key itself if unknown. */
export const t = (key: string, params: TextParams = {}): string =>
  (texts[key] ?? key).replace(/\{([a-z][a-z0-9-]*)\}/gi, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );
