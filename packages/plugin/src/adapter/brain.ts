import {
  buildSnapshot,
  diff,
  evaluate,
  guardWrite,
  isRelevant,
  relevantIds,
  toRepeatCfg,
  toTask,
} from '@questarc/engine';
import type { GameEvent, GameView, Journey, SnapshotTask } from '@questarc/engine';

import type { State } from '../shared/protocol';
import { readDay } from './day';
import type { HostApi } from './host';
import { loadRecords, writeRecords, type Records } from './records';
import { reminderSeenChanges } from './reminder-seen';
import { repeatPauseChanges } from './repeat-pause';

/**
 * Keeps the current game view in plugin.js, whether the view is open or
 * not (issue #28): reads the data, runs the engine, compares with the last
 * view and reports the events. Reading is cached: choice records until
 * they change, the archive until it may have changed (a day change, the
 * daily summary, a bound task leaving the live list, the window regaining
 * focus). Evaluations run one at a time; refresh requests in quick
 * succession are coalesced (at most one evaluation per `debounceMs`).
 */

export interface BrainOptions {
  readonly api: HostApi;
  readonly journeys: readonly Journey[];
  /** Called with the events of each new evaluation (not the first). */
  readonly onEvents: (
    events: readonly GameEvent[],
    view: GameView,
    journeys: readonly Journey[],
  ) => void;
  readonly debounceMs?: number;
}

export type Invalidate = 'tasks' | 'records' | 'archive';

export interface Brain {
  /** The current state; evaluates first if nothing is known or a refresh waits. */
  state(): Promise<State>;
  /** Marks data as changed and evaluates after a short pause. */
  refresh(what: Invalidate): void;
  /**
   * Writes choice records and returns the state that includes them. A
   * change into a read-only run or of a kind the engine does not write is
   * refused as a whole (docs/data-model.md §2, data format).
   */
  write(records: Records): Promise<State>;
  /**
   * Ends the brain when the plugin is unloaded: clears the waiting
   * refresh, ignores later ones and reports no more events.
   */
  stop(): void;
}

export const createBrain = ({ api, journeys, onEvents, debounceMs = 750 }: BrainOptions): Brain => {
  let current: State | undefined;
  let records: Records | undefined;
  let archived: readonly SnapshotTask[] | undefined;
  let liveRelevant = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let queue: Promise<State | undefined> = Promise.resolve(undefined);
  let revision = 0;
  let stopped = false;
  const pauseSeen = new Map<string, boolean>();

  const evaluateOnce = async (): Promise<State> => {
    // A hook may mark the records stale while this evaluation waits (the
    // host fires `persistedDataChanged` for its own writes too), so it
    // works on what it loaded; the refresh that follows reads them again.
    let loaded = (records ??= await loadRecords(api));
    const [app, day] = await Promise.all([api.getAppState(), readDay(api)]);
    const live = Object.values(app.tasks).map(toTask);
    const ids = relevantIds(loaded, live);
    const nowRelevant = new Set(live.filter((task) => isRelevant(task, ids)).map((t) => t.id));
    // A bound task that left the live list was archived (or deleted): read
    // the archive again so its completion does not vanish.
    if ([...liveRelevant].some((id) => !nowRelevant.has(id))) archived = undefined;
    liveRelevant = nowRelevant;
    archived ??= (await api.getArchivedTasks()).map(toTask);

    const repeatCfgs = Object.values(app.taskRepeatCfgs).map(toRepeatCfg);
    const snapshotOf = (choices: Records) =>
      buildSnapshot({
        day,
        live,
        archived: archived ?? [],
        repeatCfgs,
        records: choices,
        journeys,
      });
    let view = evaluate(snapshotOf(loaded));
    // What the host sees and the data carries no date for: a paused
    // repeat, and a reminder that came or went (game rules §2 and §9).
    const seen = {
      ...repeatPauseChanges(pauseSeen, view, loaded, repeatCfgs),
      ...reminderSeenChanges(view, loaded),
    };
    if (Object.keys(seen).length > 0) {
      await writeRecords(api, seen);
      loaded = { ...loaded, ...seen };
      if (records !== undefined) records = loaded;
      view = evaluate(snapshotOf(loaded));
    }
    const before = current?.view;
    revision += 1;
    current = { revision, view, journeys, records: loaded };
    if (before && !stopped) {
      const events = diff(before, view);
      if (events.length > 0) onEvents(events, view, journeys);
    }
    return current;
  };

  const run = (): Promise<State> => {
    const next = queue.then(evaluateOnce, evaluateOnce);
    queue = next.catch(() => undefined);
    return next;
  };

  const flush = (): Promise<State> => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
      return run();
    }
    return current ? queue.then(() => current as State) : run();
  };

  return {
    state: flush,
    refresh(what) {
      if (what === 'records') records = undefined;
      if (what === 'archive') archived = undefined;
      // A waiting refresh is kept, not restarted: dataChanged fires about
      // once a second while time tracking runs, and a restarted timer
      // would never fire.
      if (stopped || timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        void run().catch(() => undefined);
      }, debounceMs);
    },
    stop() {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
    async write(proposed) {
      const { changes } = guardWrite((await flush()).view, proposed);
      if (Object.keys(changes).length === 0) return flush();
      await writeRecords(api, changes);
      records = { ...(records ?? (await loadRecords(api))), ...changes };
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      return run();
    },
  };
};
