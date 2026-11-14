import { addDays, dayRange, daysBetween } from './days';
import { isScheduled } from './schedule';
import type { SnapshotRepeatCfg } from './types/snapshot';
import type { DayMark } from './types/view';

/**
 * Due days, misses, runs and welcome backs of one stage
 * (docs/game-rules.md §2–3, §5).
 */

/** Days without a counting completion that make a long break (game rules §5, #82). */
export const BREAK_DAYS = 14;

export interface Timeline {
  /** Due days from the accepted day to today, oldest first. */
  readonly dueDays: readonly string[];
  readonly run: { current: number; best: number; total: number; gap: boolean };
  readonly welcomeBacks: number;
  /** The run ended with a second consecutive miss and has not resumed. */
  readonly offerFallback: boolean;
  /** The last 7 scheduled days that were due or paused, oldest first. */
  readonly lastDays: readonly DayMark[];
}

const LAST_DAYS = 7;

/** Whether `day` lies in a pause: [pause, resume) from the records. */
const pausedBy = (
  actions: readonly { day: string; action: 'pause' | 'resume' }[],
): ((day: string) => boolean) => {
  return (day) => {
    let paused = false;
    for (const { day: at, action } of actions) {
      if (at > day) break;
      paused = action === 'pause';
    }
    return paused;
  };
};

export const buildTimeline = (input: {
  cfg: SnapshotRepeatCfg;
  acceptedDay: string;
  today: string;
  credited: ReadonlySet<string>;
  pauses: readonly { day: string; action: 'pause' | 'resume' }[];
  /** Days the stage was left for a smaller one (a step back): not due. */
  away?: (day: string) => boolean;
  /** The stage is walked again after a step back: its first completion is a welcome back. */
  again?: boolean;
}): Timeline => {
  const { cfg, acceptedDay, today, credited, pauses } = input;
  const away = input.away ?? (() => false);
  const recordPaused = pausedBy(pauses);
  const lastCredit = [...credited].sort().at(-1) ?? addDays(acceptedDay, -1);
  // A paused repeat config carries no dates: while it is paused and no
  // record says since when, days after the last completion are paused.
  const openRecordPause = pauses.at(-1)?.action === 'pause';
  const cfgPaused = (day: string): boolean =>
    cfg.isPaused === true && !openRecordPause && day > lastCredit;
  const deleted = new Set(cfg.deletedInstanceDates ?? []);

  const isPlanned = (day: string): boolean => isScheduled(cfg, day) && !deleted.has(day);
  const isPaused = (day: string): boolean => recordPaused(day) || cfgPaused(day) || away(day);
  // Today and yesterday are still inside the backfill window.
  const missedBefore = addDays(today, -1);

  const dueDays: string[] = [];
  const marks: DayMark[] = [];
  let current = 0;
  let best = 0;
  let consecutiveMisses = 0;
  let missSinceCredit = input.again === true;
  let welcomeBacks = 0;
  let previous = addDays(acceptedDay, -1);

  for (const day of dayRange(acceptedDay, today)) {
    const planned = isPlanned(day);
    const due = planned && !isPaused(day);
    if (due) dueDays.push(day);
    if (planned) {
      const mark = !due
        ? 'paused'
        : credited.has(day)
          ? 'done'
          : day < missedBefore
            ? 'gap'
            : 'open';
      marks.push({ day, mark });
    }
    if (credited.has(day)) {
      // Coming back is greeted after a miss and after a long break,
      // whatever lay between (gaps or a pause).
      if (missSinceCredit || daysBetween(previous, day) >= BREAK_DAYS) welcomeBacks += 1;
      previous = day;
      missSinceCredit = false;
      consecutiveMisses = 0;
      if (due) current += 1;
      best = Math.max(best, current);
    } else if (due && day < missedBefore) {
      consecutiveMisses += 1;
      missSinceCredit = true;
      if (consecutiveMisses === 2) current = 0;
    }
  }

  return {
    dueDays,
    run: { current, best, total: credited.size, gap: consecutiveMisses === 1 },
    welcomeBacks,
    offerFallback: consecutiveMisses >= 2,
    lastDays: marks.slice(-LAST_DAYS),
  };
};
