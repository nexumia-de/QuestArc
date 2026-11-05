import type { Journey } from './journey';

/**
 * The engine's input (docs/data-model.md §1). Field names and meanings are
 * Super Productivity's, so hosts copy them as they are.
 */
export interface Snapshot {
  readonly day: DayContext;
  /** Active and archived tasks; hosts may filter to bound tasks. */
  readonly tasks: readonly SnapshotTask[];
  readonly repeatCfgs: readonly SnapshotRepeatCfg[];
  /** Plugin-data key → parsed record value; empty values are ignored. */
  readonly choices: Readonly<Record<string, unknown>>;
  /** Built-in journeys; user-made ones come from `journey:<id>` records. */
  readonly journeys: readonly Journey[];
}

export interface DayContext {
  /** The user's logical day, YYYY-MM-DD. */
  readonly todayStr: string;
  /** Milliseconds after midnight at which a new logical day starts. */
  readonly startOfNextDayDiffMs: number;
  /** IANA time zone, e.g. "Europe/Berlin". */
  readonly timeZone: string;
}

export interface SnapshotTask {
  readonly id: string;
  readonly isDone: boolean;
  readonly doneOn?: number | null;
  readonly wontDoOn?: number | null;
  readonly dueDay?: string | null;
  readonly created?: number;
  readonly repeatCfgId?: string | null;
  /** Logical day → milliseconds tracked. */
  readonly timeSpentOnDay?: Readonly<Record<string, number>>;
}

export interface SnapshotRepeatCfg {
  readonly id: string;
  readonly isPaused?: boolean;
  readonly repeatCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  readonly repeatEvery: number;
  readonly startDate?: string;
  readonly repeatUntilDay?: string;
  readonly monday?: boolean;
  readonly tuesday?: boolean;
  readonly wednesday?: boolean;
  readonly thursday?: boolean;
  readonly friday?: boolean;
  readonly saturday?: boolean;
  readonly sunday?: boolean;
  readonly deletedInstanceDates?: readonly string[];
  readonly repeatFromCompletionDate?: boolean;
  readonly waitForCompletion?: boolean;
}
