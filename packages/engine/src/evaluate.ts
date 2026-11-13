import { parseChoices, type RunRecord } from './choices';
import { makeLogicalDay } from './days';
import { buildRun } from './run';
import type { Journey } from './types/journey';
import type { Snapshot } from './types/snapshot';
import type { GameView, ReadOnlyRun, RunView } from './types/view';
import { journeyErrors } from './validate';

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
  const readOnly: (Omit<ReadOnlyRun, 'state'> & { ended: boolean })[] = [];
  let activeReadOnly: string | undefined;
  for (const run of runs) {
    const ended = choices.runEnds.has(run.runId);
    const journey = journeys.get(run.journeyId);
    const format = choices.newer.get(run.runId);
    const reason: ReadOnlyRun['reason'] | undefined =
      format !== undefined
        ? 'newer-format'
        : !journey
          ? 'journey-missing'
          : journey.version < run.journeyVersion
            ? 'journey-version'
            : undefined;
    if (reason) {
      problems.push(
        reason === 'newer-format'
          ? `run ${run.runId}: written by a newer QuestArc (data format ${format})`
          : reason === 'journey-missing'
            ? `run ${run.runId}: journey ${run.journeyId} not available`
            : `run ${run.runId}: journey ${run.journeyId} version ${run.journeyVersion} not available (version ${journey?.version} here)`,
      );
      // The newest open run is the active one, also when it is read-only.
      if (!ended && open.length === 0 && activeReadOnly === undefined) activeReadOnly = run.runId;
      readOnly.push({ runId: run.runId, journeyId: run.journeyId, reason, ended });
      continue;
    }
    const view = buildRun(run, journey as Journey, ctx);
    (ended ? finished : open).push(view);
  }
  for (const [runId, format] of choices.newer) {
    if (!choices.runs.some((run) => run.runId === runId)) {
      problems.push(`run ${runId}: written by a newer QuestArc (data format ${format})`);
    }
  }

  const [first, ...rest] = open;
  const active = activeReadOnly === undefined ? first : undefined;
  const paused = activeReadOnly === undefined ? rest : open;

  return {
    todayStr: today,
    ...(active ? { active } : {}),
    paused: paused.map((run) => ({ ...run, paused: true })),
    finished,
    readOnly: readOnly.map(({ ended, ...run }) => ({
      ...run,
      state: ended ? 'finished' : run.runId === activeReadOnly ? 'active' : 'paused',
    })),
    problems,
  };
};
