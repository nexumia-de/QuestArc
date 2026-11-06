import type { GameEvent, GameView, Journey } from '@questarc/engine';

import { capitalise, findStage, progressText } from '../shared/plan';
import { hasText, t } from '../shared/texts';

/**
 * Turns the events of one evaluation into one short message (docs/behaviour.md,
 * flow A): calm texts without game words, game texts with XP and guardians.
 * Several events become one message; events without a text for the mode
 * (guardian damage, the fallback, which is a banner) add nothing.
 */
export const messageFor = (
  events: readonly GameEvent[],
  view: GameView,
  journeys: readonly Journey[],
): string | undefined => {
  const run = view.active;
  const station = run?.stations[run.position.stage];
  const stage = run && station ? findStage(journeys, run.journeyId, station.stageId) : undefined;
  const keys = new Set(events.map((e) => e.key));
  const shared = {
    action: stage ? capitalise(t(stage.plan.action)) : '',
    progress: stage && station ? progressText(stage, station) : '',
    guardian: stage?.guardian ? t(stage.guardian.name) : '',
  };

  const parts: string[] = [];
  for (const event of events) {
    let key = `${event.key}.${view.mode}`;
    if (key === 'event.welcome-back.rpg' && keys.has('event.guardian-damaged')) {
      key = 'event.welcome-back.rpg-guardian';
    }
    if (!hasText(key)) key = event.key;
    if (!hasText(key)) continue;
    parts.push(t(key, { ...shared, ...event.params }));
  }
  return parts.length > 0 ? parts.join(' ') : undefined;
};
