import { stepBack } from '@questarc/engine';

import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { appState } from '../app-state';
import { h } from '../dom';
import { shortDate } from '../journey/format';
import { taskOfCfg } from '../repeat';
import type { Context, Screen } from '../screen';

/**
 * Start smaller after a long break (docs/behaviour.md, flow D): the
 * finished station before the current one is walked again. The screen
 * says what stays and which task counts, and lets the user also call the
 * gap a pause; then flow B if the earlier task no longer repeats.
 */
export const smallerScreen = (ctx: Context): Screen => {
  const { view, journeys, records } = ctx.state;
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  const index = (run?.position.stage ?? 0) - 1;
  const stage = journey?.stages[index];
  if (!run || !journey || !stage || run.comeBack?.smaller !== stage.id) {
    queueMicrotask(() => ctx.reset({ name: 'journey' }));
    return { title: t('ui.app.name'), body: h('p', {}) };
  }
  const app = appState(ctx);
  const tasks = app ? Object.values(app.tasks) : [];
  const binding = records[`binding:${run.runId}:${stage.id}`] as
    { repeatCfgId?: string } | undefined;
  const earlier = binding?.repeatCfgId ? taskOfCfg(tasks, binding.repeatCfgId) : undefined;
  const start = async () => {
    await ctx.write(stepBack(run, view.todayStr, { pause: ctx.draft.pause === true }));
    ctx.reset({ name: 'journey' });
    if (app && !earlier) ctx.go({ name: 'setup' });
  };
  return {
    title: t('ui.comeback.smaller'),
    body: h(
      'div',
      { class: 'qa-stack' },
      h(
        'section',
        { class: 'qa-card' },
        h(
          'p',
          { class: 'qa-overline' },
          t('ui.station.of', { n: index + 1, total: journey.stages.length }),
        ),
        h('p', { class: 'qa-plan' }, planSentence(stage, run.stations[index]?.pair, run.anchor)),
      ),
      h('p', {}, t('ui.smaller.text')),
      app ? h('p', {}, t(earlier ? 'ui.smaller.task-earlier' : 'ui.smaller.task-new')) : null,
      h('p', { class: 'qa-muted' }, t('ui.smaller.current')),
      h(
        'label',
        { class: 'qa-switch-row' },
        h('input', {
          type: 'checkbox',
          checked: ctx.draft.pause === true,
          onchange: (event: Event) => {
            ctx.draft.pause = (event.target as HTMLInputElement).checked;
          },
        }),
        h('span', {}, t('ui.smaller.pause', { date: shortDate(run.comeBack.from) })),
      ),
    ),
    actions: [
      h(
        'button',
        { class: 'qa-btn qa-btn-primary', type: 'button', onclick: () => void start() },
        t('ui.comeback.smaller'),
      ),
    ],
  };
};
