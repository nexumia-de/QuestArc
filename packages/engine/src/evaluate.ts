import { parseChoices, type RunRecord } from './choices';
import { makeLogicalDay } from './days';
import { buildRun } from './run';
import type { Journey } from './types/journey';
import type { Snapshot } from './types/snapshot';
import type { GameView, RunView } from './types/view';
import { journeyErrors } from './validate';
import { levelFor } from './xp';

/**
 * Derives the whole game from a snapshot. Pure: the same snapshot gives
 * the same view, in Node and in gjs.
 */
export const evaluate = (snapshot: Snapshot): GameView => {
  const today = snapshot.day.todayStr;
  const choices = parseChoices(snapshot.choices);
  const problems = [...choices.problems];

  const journeys = new Map<string, Journey>();
  for (const candidate of [...snapshot.journeys, ...choices.userJourneys]) {
    const errors = journeyErrors(candidate);
    const id = (candidate as { id?: unknown })?.id;
    if (errors.length > 0) {
      problems.push(`journey ${typeof id === 'string' ? id : '?'}: ${errors.join('; ')}`);
    } else {
      journeys.set((candidate as Journey).id, candidate as Journey);
    }
  }

  const ctx = {
    today,
    tasks: snapshot.tasks,
    repeatCfgs: snapshot.repeatCfgs,
    choices,
    logicalDay: makeLogicalDay(snapshot.day.timeZone, snapshot.day.startOfNextDayDiffMs),
  };

  const open: RunView[] = [];
  const finished: RunView[] = [];
  // The active run is the one started or resumed last (data model §2):
  // newest activation day first, then a run that is not paused, then the
  // larger run id, so devices that changed runs concurrently agree.
  const activation = (run: RunRecord): string => {
    const resumes = (choices.pauses.get(run.runId) ?? []).filter(
      (p) => p.action === 'resume' && p.day <= today,
    );
    const last = resumes.at(-1)?.day ?? '';
    return last > run.startDay ? last : run.startDay;
  };
  const pausedNow = (run: RunRecord): number =>
    (choices.pauses.get(run.runId) ?? []).filter((p) => p.day <= today).at(-1)?.action === 'pause'
      ? 1
      : 0;
  const runs = [...choices.runs].sort(
    (a, b) =>
      activation(b).localeCompare(activation(a)) ||
      pausedNow(a) - pausedNow(b) ||
      b.runId.localeCompare(a.runId),
  );
  for (const run of runs) {
    const journey = journeys.get(run.journeyId);
    if (!journey) {
      problems.push(`run ${run.runId}: journey ${run.journeyId} not available`);
      continue;
    }
    const view = buildRun(run, journey, ctx);
    (choices.runEnds.has(run.runId) ? finished : open).push(view);
  }

  const totalXp = [...open, ...finished]
    .flatMap((run) => run.stations)
    .reduce((sum, station) => sum + station.xp, 0);
  const [active, ...paused] = open;

  return {
    todayStr: today,
    mode: choices.mode,
    totalXp,
    level: levelFor(totalXp),
    ...(active ? { active } : {}),
    paused: paused.map((run) => ({ ...run, paused: true })),
    finished,
    problems,
  };
};
