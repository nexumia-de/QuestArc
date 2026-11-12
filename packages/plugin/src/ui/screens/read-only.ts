import type { ReadOnlyRun } from '@questarc/engine';
import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';

/**
 * Screen 4 for a read-only journey (docs/behaviour.md, docs/data-model.md
 * §2): written by a newer QuestArc, or its journey (version) is not here.
 * One calm sentence instead of wrong progress; no action writes for it.
 */
export const readOnlyScreen = (ctx: Context, run: ReadOnlyRun): Screen => {
  const journey = ctx.state.journeys.find((j) => j.id === run.journeyId);
  return {
    title: journey ? t(journey.title) : t('ui.read-only.title'),
    menu: [{ label: t('ui.shelf.title'), onSelect: () => ctx.go({ name: 'shelf' }) }],
    body: h(
      'div',
      { class: 'qa-empty', role: 'status' },
      h('p', {}, t(run.reason === 'newer-format' ? 'ui.read-only.newer' : 'ui.read-only.missing')),
    ),
  };
};
