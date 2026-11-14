/** Dates for the journey view, in English until German follows (#39). */

const LOCALE = 'en-GB';

const atNoon = (day: string): Date => new Date(`${day}T12:00:00Z`);

/** "9 Nov" */
export const shortDate = (day: string): string =>
  new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    atNoon(day),
  );

/** "Mo" */
export const weekdayLetters = (day: string): string =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: 'UTC' })
    .format(atNoon(day))
    .slice(0, 2);

/** "Monday" */
export const weekdayName = (day: string): string =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'long', timeZone: 'UTC' }).format(atNoon(day));

/** A known week (Monday 2 November 2026) to name weekdays by their short id. */
const WEEK: Record<string, string> = {
  mon: '2026-11-02',
  tue: '2026-11-03',
  wed: '2026-11-04',
  thu: '2026-11-05',
  fri: '2026-11-06',
  sat: '2026-11-07',
  sun: '2026-11-08',
};

/** "mon" → "Monday" */
export const weekdayOfId = (id: string): string => weekdayName(WEEK[id] ?? WEEK.mon ?? '');

/** Days between two YYYY-MM-DD dates and date arithmetic, for the start options. */
export const addDays = (day: string, n: number): string =>
  new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Whole days from one YYYY-MM-DD date to another. */
export const daysApart = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);

/** The next Monday after `day`. */
export const nextMonday = (day: string): string => {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return addDays(day, (8 - weekday) % 7 || 7);
};

/** The first day of the month after `day`. */
export const firstOfNextMonth = (day: string): string => {
  const [year, month] = day.split('-').map(Number) as [number, number];
  return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
};
