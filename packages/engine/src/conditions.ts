import type { Condition } from './types/journey';

/**
 * Stage conditions (docs/game-rules.md §4): `days` n of the last m due days,
 * `count` n completions, `time_spent` n minutes, all since acceptance.
 */
export const conditionProgress = (
  condition: Condition,
  input: { dueDays: readonly string[]; credited: ReadonlySet<string>; minutes: number },
): { progress: number; met: boolean } => {
  let value: number;
  let target: number;
  if (condition.type === 'days') {
    value = input.dueDays.slice(-condition.of).filter((day) => input.credited.has(day)).length;
    target = condition.n;
  } else if (condition.type === 'count') {
    value = input.credited.size;
    target = condition.n;
  } else {
    value = input.minutes;
    target = condition.minutes;
  }
  const progress = target > 0 ? Math.min(1, value / target) : 1;
  return { progress, met: value >= target };
};

/**
 * Marker progress (docs/game-rules.md §9): the highest progress the
 * condition reached on any day since acceptance, each day evaluated with
 * the due days and completions up to that day. `count` and `time_spent`
 * only add up, so theirs is today's; `days` slides its window over the
 * due days once (docs/decisions/marker-progress.md).
 */
export const bestProgress = (
  condition: Condition,
  input: { dueDays: readonly string[]; credited: ReadonlySet<string>; minutes: number },
): number => {
  if (condition.type !== 'days') return conditionProgress(condition, input).progress;
  const { dueDays, credited } = input;
  let inWindow = 0;
  let best = 0;
  dueDays.forEach((day, i) => {
    if (credited.has(day)) inWindow += 1;
    const leaving = dueDays[i - condition.of];
    if (leaving !== undefined && credited.has(leaving)) inWindow -= 1;
    if (inWindow > best) best = inWindow;
  });
  return condition.n > 0 ? Math.min(1, best / condition.n) : 1;
};
