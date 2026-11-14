import { checkPlan } from '@questarc/engine';

import { t } from '../../shared/texts';
import { h } from '../dom';
import { planCheckFields } from '../journey/plan-check';
import type { Context, Screen } from '../screen';

/**
 * Screen 3b from the journey's menu (docs/behaviour.md): the plan check
 * of the active journey, to fill in later, change or empty. Save writes
 * the answers as one record; no answer at all withdraws it.
 */
export const planCheckScreen = (ctx: Context): Screen => {
  const run = ctx.state.view.active;
  if (!run) return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  const answers = (ctx.draft.check ??= { ...run.planCheck }) as Record<string, string | undefined>;
  const save = async () => {
    const changes = checkPlan(run.runId, answers);
    if (run.planCheck || Object.values(changes)[0]) await ctx.write(changes);
    ctx.back();
  };
  return {
    title: t('ui.check.title'),
    body: h('div', { class: 'qa-stack' }, ...planCheckFields(answers)),
    actions: [
      h(
        'button',
        { class: 'qa-btn qa-btn-primary', type: 'button', onclick: () => void save() },
        t('ui.check.save'),
      ),
    ],
  };
};
