import type { HabitView, Journey, RunAnchor, RunView, Stage, StationState } from '@questarc/engine';

import { capitalise, planAnchor } from '../shared/plan';
import type { State } from '../shared/protocol';
import { t } from '../shared/texts';

/**
 * The habits finished journeys leave (docs/behaviour.md, screen 7 and
 * flow F), and the one stage a screen works on: the active journey's
 * current stage, or the habit of a finished journey named by its run.
 */

export interface Habit {
  readonly run: RunView;
  readonly journey: Journey;
  readonly stage: Stage;
  readonly habit: HabitView;
}

export const habitsOf = (state: State): Habit[] =>
  state.view.finished.flatMap((run) => {
    const journey = state.journeys.find((j) => j.id === run.journeyId);
    const stage = journey?.stages.find((s) => s.id === run.habit?.stageId);
    return journey && stage && run.habit ? [{ run, journey, stage, habit: run.habit }] : [];
  });

export const habitOf = (state: State, runId: string): Habit | undefined =>
  habitsOf(state).find((entry) => entry.run.runId === runId);

/**
 * The habit in words for a question: "Walk for 15 minutes after lunch",
 * in quotes, with the run's anchor in the user's words.
 */
export const habitName = (stage: Stage, anchor?: RunAnchor): string => {
  const own = planAnchor(anchor);
  return t(`ui.checkin.habit${!own || own.form === 'after' ? '' : `-${own.form}`}`, {
    action: capitalise(t(stage.plan.action)),
    anchor: own?.text ?? t(stage.plan.anchor),
  });
};

export interface Target {
  readonly run: RunView;
  readonly journey: Journey;
  readonly index: number;
  readonly stage: Stage;
  readonly state: StationState | HabitView['state'];
  /** Set when the target is a finished journey's habit. */
  readonly habit?: HabitView;
}

export const targetOf = (state: State, runId?: string): Target | undefined => {
  if (runId !== undefined) {
    const found = habitOf(state, runId);
    return found
      ? {
          run: found.run,
          journey: found.journey,
          index: found.journey.stages.indexOf(found.stage),
          stage: found.stage,
          state: found.habit.state,
          habit: found.habit,
        }
      : undefined;
  }
  const run = state.view.active;
  const journey = run && state.journeys.find((j) => j.id === run.journeyId);
  const index = run?.position.stage ?? 0;
  const station = run?.stations[index];
  const stage = journey?.stages[index];
  return run && journey && station && stage
    ? { run, journey, index, stage, state: station.state }
    : undefined;
};
