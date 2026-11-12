import { chooseBuild, withdraw, type BuildChoice } from '@questarc/engine';

import { t } from '../../shared/texts';
import { h } from '../dom';
import { buildChooser } from '../journey/build-choice';
import type { Context, Screen } from '../screen';

/**
 * Screen 3a from the journey's menu (docs/behaviour.md): what the active
 * journey builds, what hangs and the colour; each change is written at
 * once. Nothing is lost: version and marker are derived from the stages.
 */
export const buildScreen = (ctx: Context): Screen => {
  const { view, journeys, records } = ctx.state;
  const run = view.active;
  const journey = run && journeys.find((j) => j.id === run.journeyId);
  if (!run || !journey) return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.gone')) };
  const key = `build:${run.runId}`;
  const raw = records[key];
  const choice: BuildChoice = typeof raw === 'object' && raw !== null ? (raw as BuildChoice) : {};
  const own = Object.keys(choice).length > 0;
  return {
    title: t('ui.build.title'),
    body: h(
      'div',
      { class: 'qa-stack' },
      h('p', { class: 'qa-muted' }, t('ui.build.keeps')),
      buildChooser(journey, choice, (next) => void ctx.write(chooseBuild(run.runId, next))),
      own
        ? h(
            'button',
            {
              class: 'qa-btn qa-btn-secondary',
              type: 'button',
              onclick: () => void ctx.write(withdraw(key)),
            },
            t('ui.build.suggestion'),
          )
        : null,
    ),
  };
};
