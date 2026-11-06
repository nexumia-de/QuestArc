import { bindStage } from '@questarc/engine';
import { capitalise, planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { appState } from '../app-state';
import { h } from '../dom';
import { weekdayOfId } from '../journey/format';
import { scheduleText, taskOfCfg } from '../repeat';
import type { Context, Screen } from '../screen';

/**
 * Flow B, set up the task (docs/decisions/recurring-task-setup.md): the
 * plugin cannot create a repeat, so it creates the task and opens it for
 * the user to set the repeat, or binds a recurring task the user already
 * has. It also handles a task that does not repeat yet, a repeat journeys
 * cannot follow, and a task that is gone.
 */
export const setupScreen = (ctx: Context): Screen => {
  const { view, journeys, records } = ctx.state;
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  const index = run?.position.stage ?? 0;
  const station = run?.stations[index];
  const stage = journey?.stages[index];
  if (!run || !journey || !station || !stage) {
    return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  }
  if (station.state !== 'unbound' && station.state !== 'unsupported-repeat') {
    // Bound in the meantime (the repeat was set): back to the journey.
    queueMicrotask(() => ctx.reset({ name: 'home' }));
  }

  const app = appState(ctx);
  const binding = records[`binding:${run.runId}:${stage.id}`] as
    { taskId?: string; repeatCfgId?: string } | undefined;
  const task = binding?.taskId ? app?.tasks[binding.taskId] : undefined;
  const suggested = scheduleText(stage.schedule, weekdayOfId);
  const prevStage = journey.stages[index - 1];
  const prevBinding = prevStage
    ? (records[`binding:${run.runId}:${prevStage.id}`] as
        { taskId?: string; repeatCfgId?: string } | undefined)
    : undefined;
  const prevTask =
    app && prevBinding?.repeatCfgId
      ? taskOfCfg(Object.values(app.tasks), prevBinding.repeatCfgId)
      : undefined;

  const open = (taskId: string) => () => void PluginAPI.selectTask(taskId);
  const create = async () => {
    const title = t('ui.setup.task-title', {
      anchor: capitalise(t(stage.plan.anchor)),
      action: t(stage.plan.action),
    });
    const taskId = await PluginAPI.addTask({ title, isIgnoreShortSyntax: true });
    await ctx.write(bindStage({ runId: run.runId, stageId: stage.id, taskId, day: view.todayStr }));
    await PluginAPI.selectTask(taskId);
  };
  const btn = (label: string, onclick: () => void, primary = false) =>
    h(
      'button',
      {
        class: primary ? 'qa-btn qa-btn-primary' : 'qa-btn qa-btn-secondary',
        type: 'button',
        onclick,
      },
      label,
    );
  const pick = () => ctx.go({ name: 'pick-task' });

  let message: string;
  let actions: Node[];
  if (station.state === 'unsupported-repeat') {
    message = t('ui.setup.unsupported');
    actions = [btn(t('ui.setup.other'), pick)];
    const cfgId = binding?.repeatCfgId ?? task?.repeatCfgId;
    const cfgTask = app && cfgId ? taskOfCfg(Object.values(app.tasks), cfgId) : undefined;
    if (cfgTask) actions.unshift(btn(t('ui.setup.open'), open(cfgTask.id), true));
  } else if (task && !task.repeatCfgId) {
    message = t('ui.setup.waiting', { schedule: suggested });
    actions = [btn(t('ui.setup.open'), open(task.id), true), btn(t('ui.setup.other'), pick)];
  } else {
    message = binding && app && !task ? t('ui.setup.gone') : t('ui.setup.choose');
    actions = [
      btn(t('ui.setup.create'), () => void create(), true),
      btn(t('ui.setup.existing'), pick),
    ];
  }

  return {
    title: t('ui.setup.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      h(
        'section',
        { class: 'qa-card' },
        h('p', { class: 'qa-overline' }, t('ui.setup.plan')),
        h('p', { class: 'qa-plan' }, planSentence(stage)),
        h('p', { class: 'qa-muted' }, t('ui.setup.suggested', { schedule: suggested })),
      ),
      h('p', {}, message),
      prevTask && station.state === 'unbound' && !task
        ? h(
            'div',
            { class: 'qa-stack' },
            h('p', { class: 'qa-muted' }, t('ui.setup.earlier')),
            btn(t('ui.setup.open-earlier'), open(prevTask.id)),
          )
        : null,
    ),
    actions,
  };
};
