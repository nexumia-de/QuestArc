/**
 * The engine's input: the part of Super Productivity's data the game is
 * derived from. Hosts build it from their own source (the plugin API in
 * Super Productivity, the dataset in Pensum). The full model is specified
 * in docs/data-model.md; this is the subset the skeleton uses.
 */
export interface SnapshotTask {
  readonly id: string;
  readonly isDone: boolean;
  /** Epoch ms when the task was marked done. */
  readonly doneOn?: number | null;
  /** Set together with doneOn when the task was finished as "won't do". */
  readonly wontDoOn?: number | null;
  /** Milliseconds per logical day, e.g. { "2026-11-05": 1800000 }. */
  readonly timeSpentOnDay?: Readonly<Record<string, number>>;
}

export interface Snapshot {
  /** Active and archived tasks. */
  readonly tasks: readonly SnapshotTask[];
  /** The user's logical day, as Super Productivity's getDayContext().todayStr. */
  readonly todayStr: string;
}
