import { isTime, type AnchorRecord, type Choices } from './choices';
import type { Journey } from './types/journey';
import type {
  AnchorDue,
  AnchorHabit,
  AnchorStep,
  AnchorView,
  RunAnchor,
  RunView,
} from './types/view';

/**
 * Anchors (docs/game-rules.md §8, design rules 2, 3 and 28): the user
 * names a moment that already exists in their day, and journeys start
 * from it. The engine reads no meaning from the words; it only groups
 * what it has computed by anchor: the habits finished journeys left, the
 * one growing step, the journeys that wait and the questions due.
 * Everything a graduated step shows comes from records, so it stands
 * when its task is ended or deleted.
 */

/**
 * The anchor a run starts from: its `run-anchor` record and the anchor
 * that names. A chain (`after`) holds only while the step it follows is
 * the habit of a finished journey at the same anchor.
 */
export const runAnchorOf = (
  runId: string,
  choices: Choices,
  journeys: ReadonlyMap<string, Journey>,
): RunAnchor | undefined => {
  const link = choices.runAnchors.get(runId);
  const record = link && choices.anchors.get(link.anchorId);
  if (!link || !record) return undefined;
  const { kind, words, time } = record;
  const anchor = {
    id: link.anchorId,
    kind,
    ...(words !== undefined ? { words } : {}),
    ...(time !== undefined ? { time } : {}),
  };
  const followed =
    link.after !== undefined && link.after !== runId
      ? choices.runs.find((run) => run.runId === link.after)
      : undefined;
  const last = followed && journeys.get(followed.journeyId)?.stages.at(-1);
  if (
    !followed ||
    !last ||
    choices.runAnchors.get(followed.runId)?.anchorId !== link.anchorId ||
    !choices.runEnds.has(followed.runId) ||
    !choices.checkpoints.has(`${followed.runId}:${last.id}`)
  )
    return anchor;
  return {
    ...anchor,
    after: { runId: followed.runId, journeyId: followed.journeyId, stageId: last.id },
  };
};

interface Group {
  readonly view: Omit<AnchorView, 'state' | 'growing' | 'resting' | 'steps' | 'due'>;
  /** The earliest start of a run here, for a stable order. */
  first: string;
  growing?: AnchorStep;
  readonly resting: AnchorStep[];
  readonly steps: (AnchorHabit & { readonly startDay: string })[];
  readonly due: AnchorDue[];
}

/** Sorts after every day: an anchor no run names yet. */
const NO_RUN = '9999-99-99';

export const anchorViews = (
  choices: Choices,
  journeys: ReadonlyMap<string, Journey>,
  runs: {
    readonly active?: RunView;
    readonly paused: readonly RunView[];
    readonly finished: readonly RunView[];
  },
): AnchorView[] => {
  const groups = new Map<string, Group>();
  const group = (key: string, view: Group['view']): Group => {
    const found = groups.get(key);
    if (found) return found;
    const made: Group = { view, first: NO_RUN, resting: [], steps: [], due: [] };
    groups.set(key, made);
    return made;
  };
  // Every anchor the user named is listed, also one where nothing stands yet.
  const named: [string, AnchorRecord][] = [...choices.anchors.entries()];
  for (const [id, { kind, words, time, name }] of named.sort(([a], [b]) => a.localeCompare(b))) {
    group(`a:${id}`, {
      id,
      kind,
      ...(words !== undefined ? { words } : {}),
      ...(time !== undefined ? { time } : {}),
      ...(name !== undefined ? { name } : {}),
    });
  }
  for (const run of choices.runs) {
    const link = choices.runAnchors.get(run.runId);
    const found = link && groups.get(`a:${link.anchorId}`);
    if (found && run.startDay < found.first) found.first = run.startDay;
  }

  // A run from before anchors: grouped by its journey, whose plan
  // sentence suggests the words until the user confirms them.
  const groupOf = (run: RunView): Group => {
    const own = run.anchor && groups.get(`a:${run.anchor.id}`);
    if (own) return own;
    const hint = journeys.get(run.journeyId)?.anchor?.time;
    const made = group(`j:${run.journeyId}`, {
      kind: isTime(hint) ? 'time' : 'routine',
      ...(isTime(hint) ? { time: hint } : {}),
      suggest: run.journeyId,
    });
    if (run.startDay < made.first) made.first = run.startDay;
    return made;
  };
  const step = (run: RunView, stageId: string): AnchorStep => ({
    runId: run.runId,
    journeyId: run.journeyId,
    stageId,
    ...(run.anchor?.after ? { after: run.anchor.after.runId } : {}),
  });
  const current = (run: RunView): string => run.stations[run.position.stage]?.stageId ?? '';

  const { active } = runs;
  if (active) {
    const at = groupOf(active);
    at.growing = step(active, current(active));
    if (active.checkinDue && !active.paused)
      at.due.push({ runId: active.runId, stageId: current(active), ask: 'weekly' });
  }
  for (const run of runs.paused) groupOf(run).resting.push(step(run, current(run)));
  for (const run of runs.finished) {
    const habit = run.habit;
    if (!habit) continue;
    const at = groupOf(run);
    at.steps.push({ ...step(run, habit.stageId), state: habit.state, startDay: run.startDay });
    if (habit.graduated?.checkDue)
      at.due.push({ runId: run.runId, stageId: habit.stageId, ask: 'still' });
    else if (habit.checkinDue)
      at.due.push({ runId: run.runId, stageId: habit.stageId, ask: 'weekly' });
  }

  return [...groups.entries()]
    .sort(
      ([a, x], [b, y]) =>
        // The user's anchors first, then runs from before anchors.
        a.charAt(0).localeCompare(b.charAt(0)) ||
        x.first.localeCompare(y.first) ||
        a.localeCompare(b),
    )
    .map(([, { view, growing, resting, steps, due }]) => ({
      ...view,
      state: growing ? 'growing' : 'resting',
      ...(growing ? { growing } : {}),
      resting,
      steps: [...steps]
        .sort((a, b) => a.startDay.localeCompare(b.startDay) || a.runId.localeCompare(b.runId))
        .map(({ runId, journeyId, stageId, after, state }) => ({
          runId,
          journeyId,
          stageId,
          ...(after !== undefined ? { after } : {}),
          state,
        })),
      due,
    }));
};
