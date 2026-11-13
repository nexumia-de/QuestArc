import { PAIR_LIMIT, pairStage, pairWords, type RunView, type Stage } from '@questarc/engine';

import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context } from '../screen';

/**
 * "Pair it with" (design rule 7, docs/behaviour.md flow B): an optional
 * field for something the user enjoys only while doing the stage's
 * habit. Never focused on opening; `plan` shows the sentence as it is
 * typed. Leaving the field writes the record, an empty field withdraws it.
 */
export const pairField = (
  ctx: Context,
  run: RunView,
  stage: Stage,
  plan: HTMLElement | SVGElement,
): HTMLElement => {
  const draft = `pair:${stage.id}`;
  const stored = run.stations.find((s) => s.stageId === stage.id)?.pair ?? '';
  const input = h('input', {
    id: 'qa-pair',
    class: 'qa-input',
    type: 'text',
    maxlength: PAIR_LIMIT,
    autocomplete: 'off',
    'aria-describedby': 'qa-pair-hint',
    oninput: () => {
      ctx.draft[draft] = input.value;
      plan.textContent = planSentence(stage, pairWords(input.value));
    },
    onchange: () => {
      ctx.draft[draft] = undefined;
      if (pairWords(input.value) !== stored)
        void ctx.write(pairStage(run.runId, stage.id, input.value));
    },
  }) as HTMLInputElement;
  input.value = (ctx.draft[draft] as string | undefined) ?? stored;
  plan.textContent = planSentence(stage, pairWords(input.value));
  return h(
    'div',
    { class: 'qa-field' },
    h('label', { for: 'qa-pair', class: 'qa-section-title' }, t('ui.pair.label')),
    input,
    h('p', { id: 'qa-pair-hint', class: 'qa-muted qa-small' }, t('ui.pair.hint')),
  ) as HTMLElement;
};
