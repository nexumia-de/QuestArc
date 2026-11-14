import type { Choices } from './choices';
import { addDays, isoWeek, weekdayIndex } from './days';
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
