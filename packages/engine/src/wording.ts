/**
 * Wording the design rules forbid in a journey's texts
 * (docs/psychology.md, rules 4, 5, 11, 12 and 15), one list per
 * language; the journey checker runs each language's list on its
 * texts. A language without a list is not checked: a new language
 * brings its list (docs/authoring-journeys.md, adding a language).
 */

export interface BannedWording {
  readonly pattern: RegExp;
  /** Ends the sentence "This text …"; names the rule. */
  readonly message: string;
}

const DAYS = 'promises or names a number of days; say "it varies a lot" instead (rule 4)';
const CONTROLLING = 'sounds controlling; use autonomy-supportive words like "you could" (rule 15)';
const BLAME = 'blames the user; a miss is a neutral gap (rules 12 and 15)';
const STREAK = 'QuestArc counts runs that survive one miss, not streaks (rule 11)';
const QUOTE = 'looks like a quote with an author; generic quotes are not used (rule 5)';

const ENGLISH: readonly BannedWording[] = [
  { pattern: /\b\d+[\s-]*days?\b|\b(twenty-one|sixty-six)[\s-]+days?\b/i, message: DAYS },
  { pattern: /\b(must|have to|has to|you should|no excuses?)\b/i, message: CONTROLLING },
  { pattern: /\b(fail(s|ed|ure|ing)?|lazy|guilt(y)?|break the chain)\b/i, message: BLAME },
  { pattern: /\bstreaks?\b/i, message: STREAK },
  { pattern: /["“][^"”]{8,}["”]\s*[-–—]{1,2}\s*\p{Lu}/u, message: QUOTE },
];

/**
 * German (issue #39): "du musst", "du solltest", "nicht vergessen"; a
 * miss is "eine Lücke" or "ein Tag Pause", never "verpasst",
 * "versäumt", "Fehler" or "Rückfall"; the fallback is "der kleinere
 * Schritt", never "zurückstufen". `\b` knows no umlauts, so a word
 * ends at "not a letter" instead. Regular expression literals only: a
 * host that does not check journeys then carries none of this.
 */
const GERMAN: readonly BannedWording[] = [
  {
    pattern:
      /(?<![\p{L}\p{N}])(?:\d+[\s-]*Tage[ns]?|(?:einundzwanzig|sechsundsechzig)[\s-]+Tage[ns]?)(?![\p{L}\p{N}])/iu,
    message: DAYS,
  },
  {
    pattern:
      /(?<![\p{L}\p{N}])(?:muss|musst|müsst|müssen|du\s+sollst|sollst\s+du|du\s+solltest|solltest\s+du|nicht\s+vergessen|vergiss\s+nicht|vergesst\s+nicht|keine\s+Ausreden?)(?![\p{L}\p{N}])/iu,
    message: CONTROLLING,
  },
  {
    pattern:
      /(?<![\p{L}\p{N}])(?:verpass\p{L}*|versäum\p{L}*|Fehler\p{L}*|Rückfall\p{L}*|Rückfälle\p{L}*|rückfällig\p{L}*|versag\p{L}*|scheiter\p{L}*|gescheitert\p{L}*|faul\p{L}*|Schuld\p{L}*|schuldig\p{L}*|zurückstuf\p{L}*|zurückgestuft\p{L}*|zurückzustufen|Kette\s+(?:nicht\s+)?(?:unter)?brechen)(?![\p{L}\p{N}])/iu,
    message: BLAME,
  },
  {
    pattern:
      /(?<![\p{L}\p{N}])(?:Streaks?|Erfolgsserien?|Glückssträhnen?|Strähnen?)(?![\p{L}\p{N}])/iu,
    message: STREAK,
  },
  { pattern: /["“„»][^"”“«]{8,}["”“«]\s*[-–—]{1,2}\s*\p{Lu}/u, message: QUOTE },
];

/** The lists by language, as the journey's `texts` names them. */
export const BANNED: Readonly<Record<string, readonly BannedWording[]>> = {
  en: ENGLISH,
  de: GERMAN,
};

/**
 * Languages whose plan sentence needs the action in another form than
 * its name, so every action there has a text under `<key>.plan`
 * (texts.ts, PLAN_FORM).
 */
export const PLAN_FORM_LANGUAGES: readonly string[] = ['de'];
