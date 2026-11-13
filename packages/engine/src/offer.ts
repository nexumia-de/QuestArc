import type { Choices } from './choices';
import { addDays } from './days';
import type { ContinueOffer } from './types/view';

/**
 * What the continue screen suggests at a met station (docs/game-rules.md
 * §4, design rule 1): completion is not ease, so the latest weekly answer
 * for the stage decides which of the two equal choices is suggested, and
 * a `stay` record quiets the offer for a week. The user decides either way.
 */

/** Days a `stay` record quiets the offer. */
export const STAY_DAYS = 7;

/** The weekly answer of the latest ISO week for a stage, if any. */
const latestAnswer = (choices: Choices, runId: string, stageId: string): number | undefined => {
  const prefix = `${runId}:${stageId}:`;
  let week = '';
  let answer: number | undefined;
  for (const [key, score] of choices.checkins) {
    if (key.startsWith(prefix) && key.slice(prefix.length) > week) {
      week = key.slice(prefix.length);
      answer = score;
    }
  }
  return answer;
};

export const continueOffer = (
  choices: Choices,
  runId: string,
  stageId: string,
  today: string,
): ContinueOffer => {
  const answer = latestAnswer(choices, runId, stageId);
  const stayed = choices.stays.get(`${runId}:${stageId}`);
  const quietUntil = stayed !== undefined && stayed <= today ? addDays(stayed, STAY_DAYS) : '';
  return {
    suggest: answer === undefined || answer <= 3 ? 'stay' : answer >= 5 ? 'continue' : 'none',
    ...(answer !== undefined ? { answer } : {}),
    ...(quietUntil > today ? { quietUntil } : {}),
  };
};
