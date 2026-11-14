import type { Choices } from './choices';
import { addDays, daysBetween, isoWeek, weekdayIndex } from './days';
import type { WeeklyAnswers } from './types/view';

/**
 * The weekly answers of one stage, week by week (design rule 9, issue
 * #88): the row the look back shows, and whether the step feels easier
 * than four weeks ago. Only growth is put into words; a lower answer
 * gets none.
 */

/** Weeks the row shows at most. */
export const ANSWER_WEEKS = 12;

/** The latest answer is compared with one this many weeks older, or more. */
export const TREND_WEEKS = 4;

/** The answers of a stage by ISO week. */
export const answersOf = (
  choices: Choices,
  runId: string,
  stageId: string,
): ReadonlyMap<string, number> => {
  const prefix = `${runId}:${stageId}:`;
  const answers = new Map<string, number>();
  for (const [key, score] of choices.checkins) {
    if (key.startsWith(prefix)) answers.set(key.slice(prefix.length), score);
  }
  return answers;
};

/**
 * The ISO weeks from this week back to the first answered one, newest
 * first, each with its answer if there is one. Answers in weeks after
 * today's are left out.
 */
export const weeksBack = (
  answers: ReadonlyMap<string, number>,
  today: string,
): { week: string; score?: number }[] => {
  let first = '';
  for (const week of answers.keys()) if (first === '' || week < first) first = week;
  const weeks: { week: string; score?: number }[] = [];
  if (first === '') return weeks;
  const monday = addDays(today, -weekdayIndex(today));
  for (let i = 0; ; i += 1) {
    const week = isoWeek(addDays(monday, -7 * i));
    if (week < first) break;
    const score = answers.get(week);
    weeks.push(score !== undefined ? { week, score } : { week });
  }
  return weeks;
};

/** Weeks after a journey's end in which its habit is asked weekly; then every `SLOW_WEEKS`. */
export const WEEKLY_WEEKS = 8;
export const SLOW_WEEKS = 4;

/**
 * The Monday from which a finished journey's habit is asked only every
 * four weeks (game rules §6): after the ISO week of `from` (the day the
 * journey was finished, or the habit was last brought back) and the
 * eight weeks that follow it.
 */
export const slowFrom = (from: string): string =>
  addDays(from, -weekdayIndex(from) + 7 * (WEEKLY_WEEKS + 1));

/**
 * The questions asked so far, newest first, each with its answer if
 * there is one: one per ISO week, and from `slow` (a Monday) on one per
 * four weeks, answered by the latest answer inside them. A row of
 * answers "in a row" is a row of these.
 */
export const asked = (
  answers: ReadonlyMap<string, number>,
  today: string,
  slow?: string,
): { score?: number }[] => {
  const monday = addDays(today, -weekdayIndex(today));
  const questions: { score?: number }[] = [];
  let open: number | undefined;
  weeksBack(answers, today).forEach((entry, i) => {
    const start = addDays(monday, -7 * i);
    const period =
      slow !== undefined && start >= slow
        ? Math.floor(daysBetween(slow, start) / (7 * SLOW_WEEKS))
        : undefined;
    if (period === undefined || period !== open) questions.push({});
    open = period;
    const question = questions.at(-1);
    // Newest first: the first answer found in a period is its latest.
    if (question && question.score === undefined && entry.score !== undefined)
      question.score = entry.score;
  });
  return questions;
};

/** Whether the question of the current week, or four weeks, is answered. */
export const answeredNow = (
  answers: ReadonlyMap<string, number>,
  today: string,
  slow?: string,
): boolean => {
  if (slow === undefined || today < slow) return answers.has(isoWeek(today));
  const monday = addDays(today, -weekdayIndex(today));
  const first = addDays(monday, -(daysBetween(slow, monday) % (7 * SLOW_WEEKS)));
  for (let week = first; week <= monday; week = addDays(week, 7))
    if (answers.has(isoWeek(week))) return true;
  return false;
};

export const weeklyAnswers = (
  answers: ReadonlyMap<string, number>,
  today: string,
): WeeklyAnswers | undefined => {
  const back = weeksBack(answers, today);
  const latest = back.findIndex((entry) => entry.score !== undefined);
  if (latest === -1) return undefined;
  const now = back[latest]?.score;
  const then = back.slice(latest + TREND_WEEKS).find((entry) => entry.score !== undefined)?.score;
  const trend =
    now === undefined || then === undefined
      ? undefined
      : now > then
        ? 'easier'
        : now === then
          ? 'same'
          : undefined;
  return {
    weeks: back.slice(latest, latest + ANSWER_WEEKS).reverse(),
    ...(trend ? { trend } : {}),
  };
};
