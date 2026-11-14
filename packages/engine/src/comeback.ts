import type { Choices, StepBack } from './choices';
import { addDays, daysBetween } from './days';
import { BREAK_DAYS } from './timeline';
import type { Journey } from './types/journey';
import type { ComeBack } from './types/view';

/**
 * Coming back after a long break (docs/game-rules.md §5, design rule 14,
 * issue #82): when the card with its three choices is due, and which
 * stage is walked again after a step back.
 */

/**
 * The step back that is open in a run: the first stage that was left for
 * the one before it and not taken up again. Only a stage after a finished
 * one can be left.
 */
export const openStepBack = (
  journey: Journey,
  choices: Choices,
  runId: string,
  today: string,
): { index: number; day: string } | undefined => {
  for (let index = 1; index < journey.stages.length; index += 1) {
    const before = journey.stages[index - 1]?.id;
    const stage = journey.stages[index]?.id;
    if (!choices.checkpoints.has(`${runId}:${before}`)) continue;
    const open = (choices.stepBacks.get(`${runId}:${stage}`) ?? [])
      .filter((s) => s.until === undefined && s.day <= today)
      .at(-1);
    if (open) return { index, day: open.day };
  }
  return undefined;
};

/** Whether a day lies in a stretch the stage was left for a smaller one: [day, until). */
export const awayBy =
  (stepBacks: readonly StepBack[]): ((day: string) => boolean) =>
  (day) =>
    stepBacks.some((s) => s.until !== undefined && s.day <= day && day < s.until);

/**
 * The card after a long break: the last day with a counting completion,
 * in a pause or before the stage counted is at least 14 days ago, and the
 * user has not chosen to carry on for this gap. `from` is the first day
 * of the gap. The caller leaves it out for a paused or ended journey.
 */
export const comeBackOf = (input: {
  today: string;
  /** The first day the stage counts (accepted, bound, stepped back to). */
  countFrom: string;
  credited: ReadonlySet<string>;
  pauses: readonly { day: string; action: 'pause' | 'resume' }[];
  stepBacks: readonly StepBack[];
  carriedOn: string | undefined;
  /** The stage before, when it is finished and can be walked again. */
  smaller: string | undefined;
}): ComeBack | undefined => {
  const { today } = input;
  let from = input.countFrom;
  const later = (day: string | undefined): void => {
    if (day !== undefined && day > from) from = day;
  };
  for (const day of input.credited) later(addDays(day, 1));
  for (const pause of input.pauses) {
    if (pause.action === 'resume' && pause.day <= today) later(pause.day);
  }
  for (const stepBack of input.stepBacks) later(stepBack.until);
  if (daysBetween(from, today) < BREAK_DAYS - 1) return undefined;
  if (input.carriedOn !== undefined && input.carriedOn >= from) return undefined;
  return { from, ...(input.smaller !== undefined ? { smaller: input.smaller } : {}) };
};
