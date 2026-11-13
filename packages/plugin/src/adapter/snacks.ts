import type { GameEvent, GameView, Journey } from '@questarc/engine';
import type { SnackCfg } from '@questarc/sp-plugin-api';

import { capitalise, findStage, progressText } from '../shared/plan';
import { hasText, t } from '../shared/texts';

/**
 * Turns the events of one evaluation into one short message (docs/behaviour.md,
 * flow A): the real progress in words, never what was added to the build.
 * Several events become one message; events without a text (the build
 * events, the fallback, which is a banner) add nothing.
 */
export const messageFor = (
  events: readonly GameEvent[],
  view: GameView,
  journeys: readonly Journey[],
): string | undefined => {
  const run = view.active;
  const station = run?.stations[run.position.stage];
  const stage = run && station ? findStage(journeys, run.journeyId, station.stageId) : undefined;
  const shared = {
    action: stage ? capitalise(t(stage.plan.action)) : '',
    progress: stage && station ? progressText(stage, station) : '',
  };

  const parts: string[] = [];
  for (const event of events) {
    if (!hasText(event.key)) continue;
    parts.push(t(event.key, { ...shared, ...event.params }));
  }
  return parts.length > 0 ? parts.join(' ') : undefined;
};

/**
 * The message for Super Productivity's snack, with the action **Show** that
 * opens the view at the build (docs/behaviour.md, flow A; #100).
 */
export const snackFor = (
  events: readonly GameEvent[],
  view: GameView,
  journeys: readonly Journey[],
  show: () => void,
): SnackCfg | undefined => {
  const msg = messageFor(events, view, journeys);
  if (msg === undefined) return undefined;
  return {
    msg,
    type: 'SUCCESS',
    ico: 'route',
    action: { label: t('ui.snack.show'), onClick: show },
  };
};
