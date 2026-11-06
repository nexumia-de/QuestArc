import type { Journey, Stage, StationView } from '@questarc/engine';

import { t } from './texts';

/**
 * Sentences built from a journey's stage: the plan "After X, I will Y"
 * (design rule 2) and the condition's progress in words, used by the
 * view and by the messages after a completion (docs/behaviour.md).
 */

export const findStage = (journeys: readonly Journey[], journeyId: string, stageId: string) =>
  journeys.find((j) => j.id === journeyId)?.stages.find((s) => s.id === stageId);

export const planSentence = (stage: Stage): string => {
  const parts = { anchor: t(stage.plan.anchor), action: t(stage.plan.action) };
  return stage.plan.place
    ? t('ui.plan.sentence-place', { ...parts, place: t(stage.plan.place) })
    : t('ui.plan.sentence', parts);
};

/** Upper-cases the first letter, for an action used at the start of a sentence. */
export const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** "4 of 5 days", "3 of 10 times", "40 of 60 minutes". */
export const progressText = (stage: Stage, station: StationView): string => {
  const { condition } = stage;
  const target = condition.type === 'time_spent' ? condition.minutes : condition.n;
  const done = Math.min(target, Math.round(station.progress * target));
  const key = {
    days: 'ui.progress.days',
    count: 'ui.progress.count',
    time_spent: 'ui.progress.time',
  }[condition.type];
  return t(key, { done, n: target });
};
