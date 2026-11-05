import { daysBetween, weekdayIndex } from './days';
import type { SnapshotRepeatCfg } from './types/snapshot';

/**
 * Repeat schedules a stage may use (docs/game-rules.md, due days): daily,
 * every n days (2–7, counted from startDate) and chosen weekdays.
 */

const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const isSupported = (cfg: SnapshotRepeatCfg): boolean => {
  if (cfg.repeatFromCompletionDate || cfg.waitForCompletion) return false;
  if (cfg.repeatCycle === 'DAILY') {
    if (cfg.repeatEvery === 1) return true;
    return cfg.repeatEvery >= 2 && cfg.repeatEvery <= 7 && cfg.startDate !== undefined;
  }
  if (cfg.repeatCycle === 'WEEKLY') {
    return cfg.repeatEvery === 1 && WEEKDAYS.some((day) => cfg[day] === true);
  }
  return false;
};

/** Whether the config has an occurrence on `day` (assumes isSupported). */
export const isScheduled = (cfg: SnapshotRepeatCfg, day: string): boolean => {
  if (cfg.startDate !== undefined && day < cfg.startDate) return false;
  if (cfg.repeatUntilDay !== undefined && day > cfg.repeatUntilDay) return false;
  if (cfg.repeatCycle === 'DAILY') {
    if (cfg.repeatEvery === 1) return true;
    return daysBetween(cfg.startDate ?? day, day) % cfg.repeatEvery === 0;
  }
  const name = WEEKDAYS[weekdayIndex(day)];
  return name !== undefined && cfg[name] === true;
};
