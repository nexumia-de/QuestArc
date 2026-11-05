/** The engine's output (docs/data-model.md §3). */
export interface GameView {
  readonly todayStr: string;
  readonly mode: 'calm' | 'rpg';
  readonly totalXp: number;
  readonly level: number;
  readonly active?: RunView;
  readonly paused: readonly RunView[];
  readonly finished: readonly RunView[];
  /** Journeys and records the engine could not use, with the reason. */
  readonly problems: readonly string[];
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
}

export type StationState = 'done' | 'met' | 'current' | 'unbound' | 'unsupported-repeat' | 'ahead';

export interface StationView {
  readonly stageId: string;
  readonly state: StationState;
  readonly progress: number;
  readonly run: StationRun;
  /** XP earned in this stage (from the checkpoint once done). */
  readonly xp: number;
  /** Days with a counting completion since the stage was accepted. */
  readonly completions: number;
  /** First completions after a missed due day (each earns the bonus). */
  readonly welcomeBacks: number;
  readonly acceptedDay?: string;
  readonly doneDay?: string;
  readonly guardian?: { readonly hp: number; readonly damage: number; readonly defeated: boolean };
}

export interface StationRun {
  readonly current: number;
  readonly best: number;
  readonly total: number;
  /** One missed due day inside the current run, not yet followed by a completion. */
  readonly gap: boolean;
}
