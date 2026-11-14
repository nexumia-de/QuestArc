import { callItAPause, carryOn, type Journey, type RunView } from '@questarc/engine';

import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context } from '../screen';
import { shortDate } from './format';

/**
 * The card after a long break (docs/behaviour.md, flow D; design rule
 * 14): one calm greeting, the user's own reason and three equal choices.
 * Carry On and Call It a Pause write at once; Start Smaller opens its
 * own screen. None is suggested: the user decides.
 */
export const comeBackCard = (ctx: Context, run: RunView, journey: Journey): HTMLElement => {
  const today = ctx.state.view.todayStr;
  const smaller = journey.stages.find((stage) => stage.id === run.comeBack?.smaller);
  const choice = (label: string, words: string, onclick: () => void) =>
    h(
      'div',
      { class: 'qa-choice' },
      h('button', { class: 'qa-btn qa-btn-secondary', type: 'button', onclick }, label),
      h('p', { class: 'qa-muted qa-small' }, words),
    );
  return h(
    'section',
    { class: 'qa-card qa-comeback', 'aria-label': t('ui.comeback.title') },
    h('h2', { class: 'qa-section-title' }, t('ui.comeback.title')),
    h('p', {}, t('ui.comeback.text')),
    run.why ? h('p', { class: 'qa-why' }, t('ui.card.why', { why: run.why })) : null,
    choice(
      t('ui.comeback.carry-on'),
      t('ui.comeback.carry-on.text'),
      () => void ctx.write(carryOn(run, today)),
    ),
    choice(
      t('ui.comeback.pause'),
      t('ui.comeback.pause.text', { date: shortDate(run.comeBack?.from ?? today) }),
      () => void ctx.write(callItAPause(run, today)),
    ),
    smaller
      ? choice(
          t('ui.comeback.smaller'),
          t('ui.comeback.smaller.text', { action: t(smaller.plan.action) }),
          () => ctx.go({ name: 'smaller' }),
        )
      : null,
  ) as HTMLElement;
};
