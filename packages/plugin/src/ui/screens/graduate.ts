import { graduate } from '@questarc/engine';

import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { appState } from '../app-state';
import { h } from '../dom';
import { habitOf } from '../habit';
import { taskOfBinding } from '../repeat';
import type { Context, Screen } from '../screen';

/**
 * Flow F, graduation (design rule 25, game rules §6): offered when the
 * engine says the habit can graduate, never pushed. Two equal choices
 * for the task, none suggested: the user ends its repeat themselves
 * (QuestArc never changes a task; it only opens it), or keeps it
 * repeating quietly. Back changes nothing. Afterwards the same screen
 * says what happens now and, for the first choice, leads to the task.
 */
export const graduateScreen = (ctx: Context, runId: string): Screen => {
  const found = habitOf(ctx.state, runId);
  if (!found || (!found.habit.canGraduate && !found.habit.graduated)) {
    return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  }
  const { run, stage, habit } = found;
  const plan = h(
    'section',
    { class: 'qa-card' },
    h('p', { class: 'qa-plan' }, planSentence(stage, run.stations.at(-1)?.pair)),
  );

  if (habit.graduated) {
    const ends = habit.graduated.choice === 'end';
    // The task to open, while its repeat still exists.
    const app = ends ? appState(ctx) : undefined;
    const binding = ctx.state.records[`binding:${run.runId}:${stage.id}`] as
      { taskId?: string; repeatCfgId?: string } | undefined;
    const task = app ? taskOfBinding(Object.values(app.tasks), binding) : undefined;
    return {
      title: t('ui.graduated.title'),
      body: h(
        'div',
        { class: 'qa-stack' },
        plan,
        h('p', {}, t('ui.graduated.text')),
        h('p', { class: 'qa-muted' }, t(ends ? 'ui.graduated.end' : 'ui.graduated.keep')),
        task
          ? h(
              'button',
              {
                class: 'qa-btn qa-btn-secondary',
                type: 'button',
                onclick: () => void PluginAPI.selectTask(task.id),
              },
              t('ui.setup.open'),
            )
          : null,
      ),
      actions: [
        h(
          'button',
          {
            class: 'qa-btn qa-btn-primary',
            type: 'button',
            onclick: () => ctx.reset({ name: 'home' }),
          },
          t('ui.action.done'),
        ),
      ],
    };
  }

  const choice = (kind: 'end' | 'keep') =>
    h(
      'div',
      { class: 'qa-choice' },
      h(
        'button',
        {
          class: 'qa-btn qa-btn-secondary',
          type: 'button',
          onclick: () => void ctx.write(graduate(run, ctx.state.view.todayStr, kind)),
        },
        t(`ui.graduate.${kind}`),
      ),
      h('p', { class: 'qa-muted qa-small' }, t(`ui.graduate.${kind}.text`)),
    );
  return {
    title: t('ui.graduate.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      plan,
      h('p', {}, t('ui.graduate.text')),
      h('p', { class: 'qa-muted' }, t('ui.graduate.own')),
      h('h2', { class: 'qa-section-title' }, t('ui.graduate.task')),
      choice('end'),
      choice('keep'),
    ),
  };
};
