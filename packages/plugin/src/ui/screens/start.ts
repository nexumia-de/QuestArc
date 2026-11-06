import { newRunId, startJourney } from '../../shared/actions';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { firstOfNextMonth, nextMonday, shortDate } from '../journey/format';
import type { Context, Screen } from '../screen';

/**
 * Screen 3, start a journey (issue #52): the user's own reason, optional
 * and never focused on open (design rule 5), and a self-chosen start day.
 */

type StartChoice = 'today' | 'monday' | 'month' | 'date';

export const startScreen = (ctx: Context, journeyId: string): Screen => {
  const { view, journeys } = ctx.state;
  const journey = journeys.find((j) => j.id === journeyId);
  if (!journey) return { title: t('ui.app.name'), body: h('p', {}, t('ui.error.load')) };
  const today = view.todayStr;
  const choice = (ctx.draft.when as StartChoice | undefined) ?? 'today';
  const picked = (ctx.draft.date as string | undefined) ?? today;
  const days: Record<StartChoice, string> = {
    today,
    monday: nextMonday(today),
    month: firstOfNextMonth(today),
    date: picked < today ? today : picked,
  };
  const active = view.active && journeys.find((j) => j.id === view.active?.journeyId);

  const option = (value: StartChoice, label: string) =>
    h(
      'label',
      { class: 'qa-option' },
      h('input', {
        type: 'radio',
        name: 'qa-when',
        value,
        checked: value === choice,
        onchange: () => {
          ctx.draft.when = value;
          ctx.redraw();
        },
      }),
      h('span', { class: 'qa-option-title' }, label),
    );

  const start = async () => {
    const runId = newRunId();
    await ctx.write(
      startJourney({
        runId,
        journey,
        startDay: days[choice],
        why: (ctx.draft.why as string | undefined) ?? '',
      }),
    );
    ctx.reset({ name: 'home' });
    ctx.go({ name: 'setup' });
  };

  const why = h('textarea', {
    id: 'qa-why',
    class: 'qa-textarea',
    rows: 3,
    oninput: (event: Event) => {
      ctx.draft.why = (event.target as HTMLTextAreaElement).value;
    },
  }) as HTMLTextAreaElement;
  why.value = (ctx.draft.why as string | undefined) ?? '';

  return {
    title: t(journey.title),
    body: h(
      'div',
      { class: 'qa-stack' },
      h(
        'div',
        { class: 'qa-field' },
        h('label', { for: 'qa-why', class: 'qa-section-title' }, t('ui.start.why')),
        journey.why ? h('p', { class: 'qa-muted' }, t(journey.why)) : null,
        why,
        h('p', { class: 'qa-muted qa-small' }, t('ui.start.why.private')),
      ),
      h(
        'fieldset',
        { class: 'qa-fieldset' },
        h('legend', { class: 'qa-section-title' }, t('ui.start.when')),
        option('today', t('ui.start.today')),
        option('monday', t('ui.start.monday', { date: shortDate(days.monday) })),
        option('month', t('ui.start.month', { date: shortDate(days.month) })),
        option('date', t('ui.start.date')),
        choice === 'date'
          ? h('input', {
              type: 'date',
              class: 'qa-input',
              'aria-label': t('ui.start.date'),
              min: today,
              value: days.date,
              onchange: (event: Event) => {
                ctx.draft.date = (event.target as HTMLInputElement).value;
              },
            })
          : null,
      ),
      active
        ? h('p', { class: 'qa-callout' }, t('ui.start.pauses', { title: t(active.title) }))
        : null,
    ),
    actions: [
      h(
        'button',
        { class: 'qa-btn qa-btn-primary', type: 'button', onclick: start },
        t(active ? 'ui.start.pause-and-start' : 'ui.start.start'),
      ),
    ],
  };
};
