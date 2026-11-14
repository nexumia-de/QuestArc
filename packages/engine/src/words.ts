/**
 * The user's own words in a choice record (docs/data-model.md §2, own
 * words): one line, trimmed, at most `limit` characters. The engine
 * stores and returns them; it never reads a meaning from them.
 */

/** The longest "pair it with" text a host writes (design rule 7). */
export const PAIR_LIMIT = 60;

/** The longest anchor words and anchor name a host writes (design rule 2). */
export const ANCHOR_LIMIT = 40;

/** The longest answer of the plan check a host writes (design rule 6). */
export const PLAN_CHECK_LIMIT = 160;

/** The four answers of the plan check, in the order they are asked. */
export const PLAN_CHECK_FIELDS = ['wish', 'outcome', 'obstacle', 'plan'] as const;

export const ownWords = (text: unknown, limit: number): string =>
  typeof text === 'string'
    ? [...text.replace(/\s+/g, ' ').trim()].slice(0, limit).join('').trim()
    : '';

/** A "pair it with" text as it is stored: one line without a final full stop. */
export const pairWords = (text: unknown): string =>
  ownWords(text, PAIR_LIMIT).replace(/[\s.,;:!?…]+$/u, '');

/** An anchor's words or name as stored: one line without a final full stop. */
export const anchorWords = (text: unknown): string =>
  ownWords(text, ANCHOR_LIMIT).replace(/[\s.,;:!?…]+$/u, '');
