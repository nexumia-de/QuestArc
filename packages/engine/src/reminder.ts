import { asked } from './answers';
import { daysBetween } from './days';
import type { SnapshotRepeatCfg } from './types/snapshot';
import type { ReminderView } from './types/view';

/**
 * The reminder of a stage's recurring task (docs/game-rules.md §9, design
 * rule 23). QuestArc sends no notifications: the reminder is the host's
 * own, set by the user on their task. The engine reads only whether the
 * bound repeat config has one now; since when, it knows from the
 * `reminder-seen` record a host writes when it sees that change.
 */

/**
 * Super Productivity's reminder options that give a time (its
 * `TaskReminderOptionId` without `DoNotRemind`,
 * docs/super-productivity-facts.md §5).
 */
const REMIND_OPTIONS: ReadonlySet<string> = new Set([
  'AtStart',
  'm5',
  'm10',
  'm15',
  'm30',
  'h1',
  'd1',
  'd3',
  'w1',
]);

/** Weekly answers in a row from which QuestArc says the reminder may not be needed, and how high. */
export const FADE_ANSWERS = 2;
export const FADE_SCORE = 5;

/** Days without a reminder before a habit can graduate (game rules §6). */
export const QUIET_DAYS = 14;

/** What a host saw of a stage's reminder: on, or off since `day`. */
export interface ReminderSeen {
  readonly on: boolean;
  readonly day: string;
}

const isSplitTime = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{1,2}:\d{1,2}$/.test(value)) return false;
  const [hours = 99, minutes = 99] = value.split(':').map(Number);
  return hours <= 24 && minutes <= 59;
};

/**
 * Whether instances of the repeat config get a reminder: Super
 * Productivity schedules one only with a start time and a reminder
 * option that gives a time.
 */
export const hasReminder = (cfg: SnapshotRepeatCfg): boolean =>
  isSplitTime(cfg.startTime) &&
  typeof cfg.remindAt === 'string' &&
  REMIND_OPTIONS.has(cfg.remindAt);

/**
 * The reminder of a followed stage: set or not, its time, and whether
 * the weekly answers have risen (two in a row of 5 or more, the later
 * one this week or the one before): then the hosts say that the
 * reminder may not be needed any more. Nothing is said without a
 * reminder, and QuestArc never removes one.
 */
export const reminderView = (
  cfg: SnapshotRepeatCfg,
  answers: ReadonlyMap<string, number>,
  today: string,
  /** The Monday from which a habit is asked every four weeks, if it is. */
  slow?: string,
): ReminderView => {
  if (!hasReminder(cfg)) return { set: false };
  const back = asked(answers, today, slow);
  const latest = back.findIndex((entry) => entry.score !== undefined);
  const row = latest === -1 || latest > 1 ? [] : back.slice(latest, latest + FADE_ANSWERS);
  const risen =
    row.length === FADE_ANSWERS && row.every((entry) => (entry.score ?? 0) >= FADE_SCORE);
  return {
    set: true,
    ...(cfg.startTime ? { time: cfg.startTime } : {}),
    ...(risen ? { fade: true } : {}),
  };
};

/**
 * No reminder for 14 days, as far as QuestArc knows: the config has none
 * now, and no host saw one in the last 14 days. Without a record a
 * reminder counts as never set; a record that still says "on" while the
 * config has none means it went off today at the earliest.
 */
export const reminderQuiet = (
  cfg: SnapshotRepeatCfg,
  seen: ReminderSeen | undefined,
  today: string,
): boolean => {
  if (hasReminder(cfg)) return false;
  if (!seen) return true;
  return !seen.on && daysBetween(seen.day, today) >= QUIET_DAYS;
};
