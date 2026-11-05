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
