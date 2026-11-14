import { asked } from './answers';
import type { Graduation, StillCheck } from './choices';
import { addDays } from './days';
import type { Graduated } from './types/view';

/**
 * Graduation by automaticity (docs/game-rules.md §6, design rule 25):
 * when a maintained habit can graduate, and what a graduated habit is
 * asked afterwards. The numbers are design choices; no study defines
 * them.
 */

/** Weekly answers in a row that must be high, and what high means. */
export const HIGH_ANSWERS = 3;
export const HIGH_SCORE = 6;

/** The share of due days with a completion that is steady, over 28 and over 14 days. */
export const STEADY_RATE = 0.8;
export const STEADY_DAYS = 28;
/**
 * The days "no drop" looks at: the same two weeks in which the habit's
 * task had no reminder (reminder.ts, game rules §6).
 */
export const RECENT_DAYS = 14;

/** Days the offer to graduate stays quiet after "Not Now" (game rules §6). */
export const OFFER_QUIET_DAYS = 28;

/** Days after graduation QuestArc asks whether the habit still runs by itself. */
export const CHECK_AFTER_DAYS: readonly number[] = [14, 42];
/** After those, the days between two questions: at most twice a year. */
export const CHECK_EVERY_DAYS = 182;

/** The graduation that holds today: the latest one not brought back. */
export const openGraduation = (
  graduations: readonly Graduation[],
  today: string,
): Graduation | undefined =>
  graduations.filter((g) => g.until === undefined && g.day <= today).at(-1);

/**
 * Completions on due days from `from` to today: `done` of `decided`. A
 * due day is decided when it has a completion or its backfill window has
 * passed; today and yesterday without one are still open.
 */
export const completionRate = (
  dueDays: readonly string[],
  credited: ReadonlySet<string>,
  from: string,
  today: string,
): { done: number; decided: number } => {
  const missedBefore = addDays(today, -1);
  let done = 0;
  let decided = 0;
  for (const day of dueDays) {
    if (day < from) continue;
    if (credited.has(day)) {
      done += 1;
      decided += 1;
    } else if (day < missedBefore) decided += 1;
  }
  return { done, decided };
};

const steady = (rate: { done: number; decided: number }): boolean =>
  rate.decided > 0 && rate.done >= STEADY_RATE * rate.decided;

/** Whether a maintained habit can graduate today. */
export const qualifies = (input: {
  today: string;
  /** The habit's weekly answers by ISO week. */
  answers: ReadonlyMap<string, number>;
  /** The Monday from which the habit is asked every four weeks, if it is. */
  slow?: string;
  dueDays: readonly string[];
  credited: ReadonlySet<string>;
}): boolean => {
  const { today, answers, dueDays, credited } = input;
  // Three questions in a row, the last of them the current one or the
  // one before: weeks, and four weeks each once the habit is asked so.
  const back = asked(answers, today, input.slow);
  const latest = back.findIndex((entry) => entry.score !== undefined);
  if (latest === -1 || latest > 1) return false;
  const last = back.slice(latest, latest + HIGH_ANSWERS);
  if (last.length < HIGH_ANSWERS || last.some((entry) => (entry.score ?? 0) < HIGH_SCORE))
    return false;
  const since = (days: number): string => addDays(today, 1 - days);
  return (
    steady(completionRate(dueDays, credited, since(STEADY_DAYS), today)) &&
    steady(completionRate(dueDays, credited, since(RECENT_DAYS), today))
  );
};

/** The latest day on or before today on which the question after graduation is asked. */
const latestCheckDay = (graduatedDay: string, today: string): string | undefined => {
  let latest: string | undefined;
  for (const after of CHECK_AFTER_DAYS) {
    const day = addDays(graduatedDay, after);
    if (day <= today) latest = day;
  }
  const last = CHECK_AFTER_DAYS.at(-1) ?? 0;
  for (let n = 1; ; n += 1) {
    const day = addDays(graduatedDay, last + n * CHECK_EVERY_DAYS);
    if (day > today) break;
    latest = day;
  }
  return latest;
};

/**
 * A graduated habit: since when, what the user chose for its task,
 * whether the question "does it still run by itself?" is due (asked once
 * per date; a date that passed unanswered is not asked again), and
 * whether the latest answer was "not really".
 */
export const graduatedView = (
  graduation: Graduation,
  checks: readonly StillCheck[],
  today: string,
): Graduated => {
  const mine = checks.filter((check) => check.due > graduation.day && check.due <= today);
  const due = latestCheckDay(graduation.day, today);
  const answered = due !== undefined && mine.some((check) => check.due >= due);
  return {
    day: graduation.day,
    choice: graduation.choice,
    ...(due !== undefined && !answered ? { checkDue: due } : {}),
    ...(mine.at(-1)?.still === false ? { suggestBack: true } : {}),
  };
};
