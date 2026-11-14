import { bindStage } from '@questarc/engine';
import { t } from '../../shared/texts';
import { appState } from '../app-state';
import { h } from '../dom';
import { targetOf } from '../habit';
import { weekdayOfId } from '../journey/format';
import { scheduleOf, scheduleText, taskOfCfg } from '../repeat';
import type { Context, Screen } from '../screen';

/**
 * Flow B, step 3: bind a recurring task the user already has, to the
 * current station or, with `runId`, to a finished journey's habit.
 */
export const pickTaskScreen = (ctx: Context, runId?: string): Screen => {
  const { view } = ctx.state;
  const target = targetOf(ctx.state, runId);
  const app = appState(ctx);
  if (!target) return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  const { run, stage } = target;

  const tasks = app ? Object.values(app.tasks) : [];
  const choices = app
    ? Object.values(app.taskRepeatCfgs).flatMap((cfg) => {
        const schedule = scheduleOf(cfg);
        return schedule && !cfg.isPaused ? [{ cfg, schedule }] : [];
      })
    : [];

  const choose = (cfgId: string) => async () => {
    const taskId = taskOfCfg(tasks, cfgId)?.id ?? cfgId;
    await ctx.write(
      bindStage({
        runId: run.runId,
        stageId: stage.id,
        taskId,
        repeatCfgId: cfgId,
        day: view.todayStr,
      }),
    );
    ctx.reset({ name: target.habit ? 'shelf' : 'home' });
  };

  return {
    title: t('ui.pick.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      !app
        ? h('p', { class: 'qa-muted' }, t('ui.pick.loading'))
        : choices.length === 0
          ? h('p', { class: 'qa-muted' }, t('ui.pick.none'))
          : h(
              'ul',
              { class: 'qa-list' },
              ...choices.map(({ cfg, schedule }) =>
                h(
                  'li',
                  {},
                  h(
                    'button',
                    { class: 'qa-card qa-card-button', type: 'button', onclick: choose(cfg.id) },
                    h('span', { class: 'qa-plan' }, cfg.title || t('ui.pick.untitled')),
                    h('span', { class: 'qa-muted qa-small' }, scheduleText(schedule, weekdayOfId)),
                  ),
                ),
              ),
            ),
      h('p', { class: 'qa-muted qa-small' }, t('ui.pick.supported')),
    ),
  };
};
