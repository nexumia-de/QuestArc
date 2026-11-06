import { repeatPause, type GameView, type SnapshotRepeatCfg } from '@questarc/engine';

import type { Records } from './records';

/**
 * A paused repeat config carries no dates, so when the host sees the bound
 * config of the active stage change between paused and not paused, it
 * writes a pause or resume record for that day (game rules §2, pauses).
 * The first look only remembers the state. Devices that see the same
 * change write the same record, so sync keeps one.
 */
export const repeatPauseChanges = (
  seen: Map<string, boolean>,
  view: GameView,
  records: Records,
  cfgs: readonly SnapshotRepeatCfg[],
): Records => {
  const run = view.active;
  const stage = run?.stations[run.position.stage];
  if (!run || !stage || stage.state === 'done') return {};
  const binding = records[`binding:${run.runId}:${stage.stageId}`] as
    { repeatCfgId?: string } | undefined;
  const cfg = binding?.repeatCfgId ? cfgs.find((c) => c.id === binding.repeatCfgId) : undefined;
  if (!cfg) return {};
  const paused = cfg.isPaused === true;
  const before = seen.get(cfg.id);
  seen.set(cfg.id, paused);
  if (before === undefined || before === paused) return {};
  const key = `pause:${run.runId}:${view.todayStr}`;
  const action = paused ? 'pause' : 'resume';
  if ((records[key] as { action?: string } | undefined)?.action === action) return {};
  return repeatPause(run.runId, view.todayStr, paused);
};
