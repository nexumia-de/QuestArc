/** The engine's output (docs/data-model.md §3). */
export interface GameView {
  readonly todayStr: string;
  /** The active run; absent when it is read-only (then in `readOnly`). */
  readonly active?: RunView;
  readonly paused: readonly RunView[];
  readonly finished: readonly RunView[];
  /** Runs this engine cannot compute (data model §2, data format). */
  readonly readOnly: readonly ReadOnlyRun[];
  /**
   * The user's anchors with what stands at each (game rules §8), oldest
   * first; runs from before anchors come last, grouped by journey.
   */
  readonly anchors: readonly AnchorView[];
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
 * An anchor in the user's own words (design rule 2): a moment that
 * already exists in their day. `routine` has `words` that complete
 * "After …"; `time` has a fixed time of day.
 */
export interface AnchorWords {
  readonly kind: 'routine' | 'time';
  /** A routine in the user's words, e.g. "getting up". */
  readonly words?: string;
  /** A fixed time, "HH:MM" (24 hours). */
  readonly time?: string;
}

/** The anchor of a run, and the step it follows if the user chained it (design rule 3). */
export interface RunAnchor extends AnchorWords {
  /** The `anchor:<id>` record. */
  readonly id: string;
  /**
   * The user tied this run to a step that stands at the same anchor
   * instead of to the anchor itself: that step's run, journey and stage.
   * Words only; nothing is computed from it.
   */
  readonly after?: { readonly runId: string; readonly journeyId: string; readonly stageId: string };
}

/**
 * One anchor with what stands there (game rules §8): the habits finished
 * journeys left (`steps`), the one growing step if the active journey
 * starts from here, journeys that wait, and the questions that are due.
 * The hosts find each run in the view by its id.
 */
export interface AnchorView extends AnchorWords {
  /**
   * The `anchor:<id>` record; absent for runs from before anchors, which
   * are grouped by journey until the user confirms their anchor.
   */
  readonly id?: string;
  /** The name the user gave the anchor's place, if any. */
  readonly name?: string;
  /** Without `id`: the journey whose plan sentence suggests the words. */
  readonly suggest?: string;
  /** `growing`: the active journey starts from here; else the anchor rests. */
  readonly state: 'growing' | 'resting';
  /** The active journey's current stage. */
  readonly growing?: AnchorStep;
  /** Open journeys that wait here (paused), in the order of `paused`. */
  readonly resting: readonly AnchorStep[];
  /** The habits of finished journeys, oldest first; a journey ended early leaves none. */
  readonly steps: readonly AnchorHabit[];
  /** The questions that are due here: the weekly one and the one after graduation. */
  readonly due: readonly AnchorDue[];
}

export interface AnchorStep {
  readonly runId: string;
  readonly journeyId: string;
  readonly stageId: string;
  /** The run of the step this one follows (a chain), if the user tied it so. */
  readonly after?: string;
}

/** A habit at an anchor: followed until it graduates, then it only stands there. */
export interface AnchorHabit extends AnchorStep {
  readonly state: HabitView['state'];
}

export interface AnchorDue {
  readonly runId: string;
  readonly stageId: string;
  /** `weekly`: the weekly look back; `still`: "does it still run by itself?". */
  readonly ask: 'weekly' | 'still';
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
  /** The anchor the run starts from (game rules §8); absent until the user has named one. */
  readonly anchor?: RunAnchor;
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
  /** The reminder of the current stage's task, while the stage is followed (game rules §9). */
  readonly reminder?: ReminderView;
  /**
   * A finished journey only: the habit it leaves, its last stage's
   * (game rules §6). Absent while the journey is open and after it was
   * ended early.
   */
  readonly habit?: HabitView;
}

/**
 * The reminder of a followed stage's recurring task (design rule 23):
 * the host's own, set by the user on the task. QuestArc reads it and
 * never changes it.
 */
export interface ReminderView {
  /** The bound repeat config gives its instances a reminder now. */
  readonly set: boolean;
  /** With a reminder: the time of day the instances are scheduled for. */
  readonly time?: string;
  /** With a reminder: the weekly answers have risen; it may not be needed any more. */
  readonly fade?: true;
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
  /** Maintained only: the reminder of the habit's task (game rules §9). */
  readonly reminder?: ReminderView;
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
