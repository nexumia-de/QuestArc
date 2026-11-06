import { isSupported, type Schedule } from '@questarc/engine';
import type { PluginTaskRepeatCfg, Task } from '@questarc/sp-plugin-api';

import { toRepeatCfg } from '../adapter/snapshot';
import { t } from '../shared/texts';

/**
 * Super Productivity's recurring tasks as the view needs them: which can be
 * bound to a stage (game rules §2, due days), their schedule in words, and
 * the task to open for a repeat config.
 */

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
const SHORT = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const supported = (cfg: PluginTaskRepeatCfg): boolean => isSupported(toRepeatCfg(cfg));

/** The schedule of a supported config in story-format terms. */
export const scheduleOf = (cfg: PluginTaskRepeatCfg): Schedule | undefined => {
  if (!supported(cfg)) return undefined;
  if (cfg.repeatCycle === 'DAILY') {
    return cfg.repeatEvery === 1 ? { type: 'daily' } : { type: 'everyNDays', n: cfg.repeatEvery };
  }
  return {
    type: 'weekdays',
    days: SHORT.filter((_, i) => cfg[DAYS[i] as keyof PluginTaskRepeatCfg]),
  };
};

/** A live task of the config to open: an open one first, else the newest. */
export const taskOfCfg = (tasks: readonly Task[], cfgId: string): Task | undefined =>
  tasks
    .filter((task) => task.repeatCfgId === cfgId)
    .sort((a, b) => Number(a.isDone) - Number(b.isDone) || (b.created ?? 0) - (a.created ?? 0))[0];

export const scheduleText = (schedule: Schedule, weekdayName: (d: string) => string): string => {
  if (schedule.type === 'daily') return t('ui.schedule.daily');
  if (schedule.type === 'everyNDays') return t('ui.schedule.every-n', { n: schedule.n });
  return t('ui.schedule.weekdays', { days: schedule.days.map(weekdayName).join(', ') });
};
