import type { AnchorWords, Journey, RunAnchor, Stage, StationView } from '@questarc/engine';

import { stageAction, t } from './texts';

/**
 * Sentences built from a journey's stage: the plan "After X, I will Y"
 * (design rule 2), with what the user pairs it with (rule 7), and the condition's progress in words, used by the
 * view and by the messages after a completion (docs/behaviour.md).
 */

export const findStage = (journeys: readonly Journey[], journeyId: string, stageId: string) =>
  journeys.find((j) => j.id === journeyId)?.stages.find((s) => s.id === stageId);

/**
 * The start of a plan in the user's words (design rules 2 and 3, #96):
 * `after` a routine ("After getting up"), `at` a fixed time ("At
 * 21:00"), or `then`, after a step that stands at the same anchor
 * ("After I drink a glass of water"), when the user chained the run.
 */
export interface PlanAnchor {
  readonly form: 'after' | 'at' | 'then';
  readonly text: string;
}

export const planAnchor = (anchor: (AnchorWords & Partial<RunAnchor>) | undefined) => {
  if (!anchor) return undefined;
  const step = anchor.after && stageAction(anchor.after.journeyId, anchor.after.stageId);
  const found: PlanAnchor | undefined = step
    ? { form: 'then', text: step }
    : anchor.kind === 'time'
      ? { form: 'at', text: anchor.time ?? '' }
      : anchor.words
        ? { form: 'after', text: anchor.words }
        : undefined;
  return found;
};

/** "After getting up", "At 21:00", "After I drink a glass of water". */
export const anchorLabel = (anchor: PlanAnchor): string =>
  t(`ui.anchor.${anchor.form}`, { anchor: anchor.text });

/**
 * `pair` is what the user pairs the stage with, in their own words
 * (design rule 7); `anchor` is the run's anchor in the user's words,
 * without it the journey's own suggestion stands. Each form is one
 * whole sentence in content/i18n, so a language orders the parts as it
 * needs.
 */
export const planSentence = (
  stage: Stage,
  pair?: string,
  anchor?: RunAnchor | AnchorWords,
): string => {
  const { action, place } = stage.plan;
  const own = planAnchor(anchor);
  const form = !own || own.form === 'after' ? 'sentence' : own.form;
  return t(`ui.plan.${form}${place ? '-place' : ''}${pair ? '-pair' : ''}`, {
    anchor: own?.text ?? t(stage.plan.anchor),
    action: t(action),
    place: place ? t(place) : '',
    pair: pair ?? '',
  });
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
