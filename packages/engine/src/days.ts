/**
 * Logical days (docs/game-rules.md §2). Days are YYYY-MM-DD strings; date
 * arithmetic happens in UTC on those strings, so the machine's time zone
 * never matters. Only `makeLogicalDay` looks at a time zone, the user's.
 */

const DAY_MS = 86_400_000;

const toUtc = (day: string): number => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
};

const fromUtc = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export const isDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export const addDays = (day: string, n: number): string => fromUtc(toUtc(day) + n * DAY_MS);

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export const daysBetween = (from: string, to: string): number =>
  Math.round((toUtc(to) - toUtc(from)) / DAY_MS);

/** 0 = Monday … 6 = Sunday. */
export const weekdayIndex = (day: string): number => (new Date(toUtc(day)).getUTCDay() + 6) % 7;

/** ISO 8601 week, e.g. "2026-W45". */
export const isoWeek = (day: string): string => {
  const thursday = addDays(day, 3 - weekdayIndex(day));
  const year = thursday.slice(0, 4);
  const week = Math.floor(daysBetween(`${year}-01-01`, thursday) / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
};

/** Every day from `from` to `to`, both included. */
export const dayRange = (from: string, to: string): string[] => {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
};

/**
 * The logical day of a timestamp: the calendar date of
 * `timestamp − startOfNextDayDiffMs` in the user's time zone.
 */
export const makeLogicalDay = (
  timeZone: string,
  startOfNextDayDiffMs: number,
): ((timestamp: number) => string) => {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return (timestamp) => format.format(new Date(timestamp - startOfNextDayDiffMs));
};
