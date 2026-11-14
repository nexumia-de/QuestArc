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

/**
 * The optional plan check of a run (design rule 6), in the user's own
 * words: the wish, its best outcome, the main obstacle and the plan for
 * it ("If …, then I will …"). Any of them may be missing.
 */
export interface PlanCheck {
  readonly wish?: string;
  readonly outcome?: string;
  readonly obstacle?: string;
  readonly plan?: string;
}

export interface RunView {
  readonly runId: string;
  readonly journeyId: string;
  readonly startDay: string;
  readonly why?: string;
  /** The user's plan check, if they filled in any of it (shown, never evaluated). */
  readonly planCheck?: PlanCheck;
  readonly stations: readonly StationView[];
  /** Index of the current station and progress within it (0..1). */
  readonly position: { readonly stage: number; readonly progress: number };
  readonly paused: boolean;
  readonly checkinDue: boolean;
  readonly offerFallback: boolean;
  /** While the current stage is met: what the continue screen suggests (game rules §4). */
  readonly offer?: ContinueOffer;
  /** After a long break: the card with its three choices is due (game rules §5). */
  readonly comeBack?: ComeBack;
  /** What the journey builds (docs/game-rules.md §7). */
  readonly build: BuildView;
  /** The current stage's weekly answers so far, once there is one (design rule 9). */
  readonly answers?: WeeklyAnswers;
  /**
   * A finished journey only: the habit it leaves, its last stage's
   * (game rules §6). Absent while the journey is open and after it was
   * ended early.
   */
  readonly habit?: HabitView;
}

/**
 * The weekly answers of a stage as a row, week by week, and what they
 * say in words. Nothing is said when the latest answer is lower.
 */
export interface WeeklyAnswers {
  /**
   * The latest 12 ISO weeks at most, oldest first, from the first
   * answered week to the latest answered one; a skipped week has no score.
   */
  readonly weeks: readonly { readonly week: string; readonly score?: number }[];
  /**
   * The latest answer against the latest one four or more weeks before
   * it: higher is `easier`, equal is `same`; absent when lower or when
   * there is no such answer.
   */
  readonly trend?: 'easier' | 'same';
}

/**
 * The habit of a finished journey (design rules 24 and 25). While it is
 * `maintained` its task is followed as before and the weekly question
 * goes on; once `graduated` it runs by itself and nothing is followed.
 */
export interface HabitView {
  /** The journey's last stage. */
  readonly stageId: string;
  /**
   * `maintained`: followed through its recurring task; `graduated`: runs
   * by itself, not followed; `unbound` and `unsupported-repeat`: not
   * graduated, and no task that can be followed.
   */
  readonly state: 'maintained' | 'graduated' | 'unbound' | 'unsupported-repeat';
  /** Maintained: the weekly question is not answered this ISO week. */
  readonly checkinDue: boolean;
  /** Maintained: the habit can graduate now (game rules §6). */
  readonly canGraduate: boolean;
  /** The habit's weekly answers so far, once there is one. */
  readonly answers?: WeeklyAnswers;
  readonly graduated?: Graduated;
  /**
   * Maintained only: the run of the last stage's task, carried on past
   * the journey's end (game rules §3 and §6). A graduated habit has
   * none: it runs by itself.
   */
  readonly run?: StationRun;
  /** Maintained only: the last 7 due (or paused) days, oldest first. */
  readonly lastDays?: readonly DayMark[];
  /** Not graduated any more: the day the habit was last brought back. */
  readonly backDay?: string;
}

/** A graduated habit: it is not ticked off and nothing counts for it. */
export interface Graduated {
  /** The day it graduated. */
  readonly day: string;
  /** What the user chose for its task: end the repeat themselves, or keep it repeating quietly. */
  readonly choice: 'end' | 'keep';
  /**
   * "Does it still run by itself?" is due: the date it is asked for (2
   * and 6 weeks after graduation, then every 26 weeks), which names the
   * answer's record.
   */
  readonly checkDue?: string;
  /** The latest answer to that question was "not really". */
  readonly suggestBack?: true;
}

/**
 * The card after a long break (design rule 14): nothing counted for the
 * current stage for 14 days or more. The user can carry on, call the gap
 * a pause, or start smaller when a finished stage lies before this one.
 */
export interface ComeBack {
  /** The first day of the gap: after the last counting completion, pause or start of the stage. */
  readonly from: string;
  /** The finished stage before the current one, which "Start Smaller" makes current again. */
  readonly smaller?: string;
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
  /** The version standing: 1 + the finished and skipped stages; a step back does not lower it. */
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
  /** A finished stage that is walked again after a step back: since this day. */
  readonly stepBackDay?: string;
  /** The stage left behind by a step back: the day it was left; it is offered again later. */
  readonly leftDay?: string;
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
