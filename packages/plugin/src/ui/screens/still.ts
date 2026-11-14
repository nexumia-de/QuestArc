import { answerStill, bringBack } from '@questarc/engine';

import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { habitName, habitOf } from '../habit';
import { shortDate } from '../journey/format';
import type { Context, Screen } from '../screen';
import { markSeen } from '../seen';

/**
 * A graduated habit (flow F): while the question "does it still run by
 * itself?" is due, the question with its two answers; otherwise the
 * offer to bring the habit back, which the shelf also opens. "Not
 * really" changes nothing by itself. Bringing back takes nothing away:
 * the time the habit ran by itself stays as it was.
 */
export const stillScreen = (ctx: Context, runId: string): Screen => {
  const found = habitOf(ctx.state, runId);
  const graduated = found?.habit.graduated;
  if (!found || !graduated) {
    // Brought back in the meantime: the shelf shows it.
    queueMicrotask(() => ctx.reset({ name: 'shelf' }));
    return { title: t('ui.app.name'), body: h('p', {}) };
  }
  const { run, stage } = found;
  const today = ctx.state.view.todayStr;
  const plan = h(
    'section',
    { class: 'qa-card' },
    h('p', { class: 'qa-plan' }, planSentence(stage, run.stations.at(-1)?.pair)),
    h('p', { class: 'qa-muted qa-small' }, t('ui.shelf.since', { date: shortDate(graduated.day) })),
  );
  const button = (label: string, onclick: () => void, primary = false) =>
    h(
      'button',
      {
        class: `qa-btn ${primary ? 'qa-btn-primary' : 'qa-btn-secondary'}`,
        type: 'button',
        onclick,
      },
      label,
    );

  if (graduated.checkDue) {
    const due = graduated.checkDue;
    return {
      title: t('ui.still.title'),
      body: h(
        'div',
        { class: 'qa-stack' },
        plan,
        h('p', { class: 'qa-plan' }, t('ui.still.question', { habit: habitName(stage) })),
        h('p', { class: 'qa-muted' }, t('ui.still.text')),
      ),
      actions: [
        button(
          t('ui.still.yes'),
          () => void ctx.write(answerStill(run, today, true)).then(() => ctx.back()),
          true,
        ),
        // The screen then offers to bring it back.
        button(t('ui.still.no'), () => void ctx.write(answerStill(run, today, false))),
        h(
          'button',
          {
            class: 'qa-btn qa-btn-text',
            type: 'button',
            onclick: () => {
              markSeen(`still:${run.runId}:${stage.id}:${due}`);
              ctx.back();
            },
          },
          t('ui.action.not-now'),
        ),
      ],
    };
  }

  return {
    title: t('ui.still.back.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      plan,
      graduated.suggestBack ? h('p', {}, t('ui.still.back.said')) : null,
      h('p', {}, t('ui.still.back.text')),
      h('p', { class: 'qa-muted' }, t('ui.still.back.task')),
    ),
    actions: [
      button(
        t('ui.action.bring-back'),
        () => void ctx.write(bringBack(run, today)).then(() => ctx.reset({ name: 'shelf' })),
        true,
      ),
      button(t('ui.still.leave'), () => ctx.back()),
    ],
  };
};
