/** The engine's output (docs/data-model.md §3). */
export interface GameView {
  readonly todayStr: string;
  /** The active run; absent when it is read-only (then in `readOnly`). */
  readonly active?: RunView;
  readonly paused: readonly RunView[];
  readonly finished: readonly RunView[];
  /** Runs this engine cannot compute (data model §2, data format). */
  readonly readOnly: readonly ReadOnlyRun[];
  /** Journeys and records the engine could not use, with the reason. */
  readonly problems: readonly string[];
}

/**
 * A run this engine cannot compute: a record in a newer data format, or
 * its journey (version) is not available. Hosts show a read-only page
 * and write nothing for it.
 */
export interface ReadOnlyRun {
  readonly runId: string;
  readonly journeyId: string;
  readonly reason: 'newer-format' | 'journey-missing' | 'journey-version';
  /** Its place among the runs. */
  readonly state: 'active' | 'paused' | 'finished';
}

export interface RunView {
  readonly runId: string;
  readonly journeyId: string;
  readonly startDay: string;
  readonly why?: string;
  readonly stations: readonly StationView[];
  /** Index of the current station and progress within it (0..1). */
  readonly position: { readonly stage: number; readonly progress: number };
  readonly paused: boolean;
  readonly checkinDue: boolean;
  readonly offerFallback: boolean;
  /** While the current stage is met: what the continue screen suggests (game rules §4). */
  readonly offer?: ContinueOffer;
  /** What the journey builds (docs/game-rules.md §7). */
  readonly build: BuildView;
}

/**
 * The two equal choices at a met station, Continue and Stay Here a While:
 * which one the latest weekly answer for the stage suggests, and until
 * when a `stay` record keeps the offer quiet.
 */
export interface ContinueOffer {
  /** `stay` with an answer of 3 or lower or none yet, `continue` with 5 or more, else `none`. */
  readonly suggest: 'continue' | 'stay' | 'none';
  /** The latest weekly answer for this stage, 1..7. */
  readonly answer?: number;
  /** The user chose to stay: the offer is quiet before this day. */
  readonly quietUntil?: string;
}

/**
 * The build of a run in names and numbers; the hosts find the pictures by
 * these names. A host shows the first ceil(markerProgress × E) of a
 * marker's E elements, all in their "on" form while `ready`.
 */
export interface BuildView {
  /** A ladder in content/art/ (<name>.ladder.json). */
  readonly ladder: string;
  /** The version standing: 1 + the finished and skipped stages; never goes down. */
  readonly version: number;
  /** The standing versions that came from a skipped stage ("already yours"). */
  readonly skipped: readonly number[];
  /** The versions this journey uses: its stages + 1. */
  readonly versions: number;
  /** What hangs on the marker: lanterns, bunting or flowers (content/art/markers.json). */
  readonly marker: string;
  /** A hue name from content/art/palette.json. */
  readonly hue: string;
  /** The current stage's highest condition progress since it was accepted, 0..1. */
  readonly markerProgress: number;
  /** The current stage's condition holds now. */
  readonly ready: boolean;
}

export type StationState =
  'done' | 'skipped' | 'met' | 'current' | 'unbound' | 'unsupported-repeat' | 'ahead';

export interface StationView {
  readonly stageId: string;
  readonly state: StationState;
  readonly progress: number;
  readonly run: StationRun;
  /** Days with a counting completion since the stage was accepted. */
  readonly completions: number;
  /** First completions after a missed due day (each is greeted once). */
  readonly welcomeBacks: number;
  readonly acceptedDay?: string;
  readonly doneDay?: string;
  /** A skipped stage ("already yours"): the day it was skipped; it earned nothing. */
  readonly skippedDay?: string;
  /** A skipped stage whose skip can still be taken back (`undoSkip`). */
  readonly undoable?: boolean;
  /** What the user pairs this stage with, in their own words (design rule 7). */
  readonly pair?: string;
  /** Current stage only: the last 7 due (or paused) days, oldest first. */
  readonly lastDays?: readonly DayMark[];
}

/**
 * One day in the row of the last seven due days (docs/journey-design.md):
 * done, a gap (missed), open (today or yesterday, still inside the
 * backfill window) or paused (scheduled, but inside a pause).
 */
export interface DayMark {
  readonly day: string;
  readonly mark: 'done' | 'gap' | 'open' | 'paused';
}

export interface StationRun {
  readonly current: number;
  readonly best: number;
  readonly total: number;
  /** One missed due day inside the current run, not yet followed by a completion. */
  readonly gap: boolean;
}
