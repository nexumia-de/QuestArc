import type { GameView, RunView, StationView } from './types/view';

/**
 * Events between two game views (issue #23), shown by hosts as toasts. Each
 * event has an i18n key and parameters, so both hosts say the same.
 */

export interface GameEvent {
  readonly key: string;
  readonly params: Readonly<Record<string, string | number>>;
}

const currentStation = (run: RunView | undefined): StationView | undefined =>
  run?.stations[run.position.stage];

/**
 * Build events of the journey that was active (game rules §7): a higher
 * version, also when its last stage ended the journey, or else a higher
 * marker progress in the same stage.
 */
const buildEvents = (before: GameView, after: GameView): GameEvent[] => {
  const was = before.active?.build;
  const runId = before.active?.runId;
  if (!was) return [];
  const is = [after.active, ...after.paused, ...after.finished].find(
    (run) => run?.runId === runId,
  )?.build;
  if (!is) return [];
  if (is.version > was.version) {
    return [{ key: 'event.build-version', params: { version: is.version } }];
  }
  if (is.version === was.version && is.markerProgress > was.markerProgress) {
    return [
      { key: 'event.build-element', params: { from: was.markerProgress, to: is.markerProgress } },
    ];
  }
  return [];
};

export const diff = (before: GameView, after: GameView): GameEvent[] => {
  const events: GameEvent[] = [];
  const run = after.active;
  const now = currentStation(run);
  const sameRun = before.active?.runId === run?.runId;
  const then = sameRun
    ? before.active?.stations.find((s) => s.stageId === now?.stageId)
    : undefined;

  if (run && now && then) {
    const newCompletions = now.completions - then.completions;
    const newWelcomes = now.welcomeBacks - then.welcomeBacks;
    if (newCompletions > 1) {
      events.push({ key: 'event.progress-summary', params: { completions: newCompletions } });
    } else if (newWelcomes > 0) {
      events.push({ key: 'event.welcome-back', params: {} });
    } else if (newCompletions === 1) {
      events.push({ key: 'event.completion', params: {} });
    }
    if (now.state === 'met' && then.state !== 'met') {
      events.push({ key: 'event.station-reached', params: { stage: now.stageId } });
    }
    if (run.offerFallback && !before.active?.offerFallback) {
      events.push({ key: 'event.fallback-offered', params: { stage: now.stageId } });
    }
  }
  events.push(...buildEvents(before, after));
  return events;
};
