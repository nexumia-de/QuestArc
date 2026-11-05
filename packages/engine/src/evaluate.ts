import { isCompleted, timeSpentMs } from './completion';
import type { Snapshot } from './snapshot';

/**
 * The engine's output. The skeleton only proves the pipeline; the real
 * game view (level, journeys, stations, guardians) follows
 * docs/game-rules.md once it is approved.
 */
export interface GameView {
  readonly todayStr: string;
  readonly completedTasks: number;
  readonly timeSpentMs: number;
}

/** Derive the game view from a snapshot. Pure: same input, same output. */
export const evaluate = (snapshot: Snapshot): GameView => {
  const completed = snapshot.tasks.filter(isCompleted);
  return {
    todayStr: snapshot.todayStr,
    completedTasks: completed.length,
    timeSpentMs: completed.reduce((sum, task) => sum + timeSpentMs(task), 0),
  };
};
