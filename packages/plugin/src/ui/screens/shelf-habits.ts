import { planSentence } from '../../shared/plan';
import { t } from '../../shared/texts';
import { h } from '../dom';
import { habitsOf, type Habit } from '../habit';
import { shortDate } from '../journey/format';
import { lastDaysRow } from '../journey/last-days';
import type { Context, Route } from '../screen';

/**
 * The shelf's habits (docs/behaviour.md, screen 7): those that stay and
 * are still followed, with the quiet way to the weekly look back, to
 * graduation and to a task when theirs is gone; and those that run by
 * themselves, with the day, the question when it is due and "Bring It
 * Back". Nothing here is red, counted down or pushed.
 */

const card = (
  ctx: Context,
  { run, stage, habit }: Habit,
  lines: string[],
  actions: [string, Route][],
) =>
  h(
    'li',
    { class: 'qa-card' },
    h('p', { class: 'qa-plan' }, planSentence(stage, run.stations.at(-1)?.pair, run.anchor)),
    // A maintained habit's last due days and its run (#66): a gap is a
    // gap, never a loss. A graduated habit has neither.
    habit.lastDays?.length ? lastDaysRow(habit.lastDays) : null,
    ...(habit.run
      ? [
          t('ui.card.run', {
            current: habit.run.current,
            best: habit.run.best,
            total: habit.run.total,
          }),
        ]
      : []
    ).map((line) => h('p', { class: 'qa-muted qa-small' }, line)),
    ...lines.map((line) => h('p', { class: 'qa-muted qa-small' }, line)),
    ...actions.map(([label, route]) =>
      h(
        'button',
        { class: 'qa-btn qa-btn-secondary', type: 'button', onclick: () => ctx.go(route) },
        label,
      ),
    ),
  );

/** Habits that stay: followed through their recurring task. */
export const maintainedCards = (ctx: Context): Node[] => {
  return habitsOf(ctx.state)
    .filter(({ habit }) => habit.state !== 'graduated')
    .map((entry) => {
      const { run, habit } = entry;
      const runId = run.runId;
      const back = habit.backDay ? [t('ui.shelf.back', { date: shortDate(habit.backDay) })] : [];
      if (habit.state === 'unbound' || habit.state === 'unsupported-repeat') {
        const unbound = habit.state === 'unbound';
        return card(
          ctx,
          entry,
          [...back, t(unbound ? 'ui.shelf.no-task' : 'ui.card.unsupported')],
          [[t(unbound ? 'ui.action.setup' : 'ui.action.change-repeat'), { name: 'setup', runId }]],
        );
      }
      return card(
        ctx,
        entry,
        [...back, t('ui.shelf.maintained')],
        [
          ...(habit.canGraduate
            ? [[t('ui.graduate.title'), { name: 'graduate', runId }] as [string, Route]]
            : []),
          ...(habit.checkinDue
            ? [
                [
                  t(habit.fourWeekly ? 'ui.checkin.title-4' : 'ui.checkin.title'),
                  { name: 'checkin', runId },
                ] as [string, Route],
              ]
            : []),
        ],
      );
    });
};

/** Habits that run by themselves: graduated, not followed. */
export const graduatedCards = (ctx: Context): Node[] =>
  habitsOf(ctx.state).flatMap((entry) => {
    const graduated = entry.habit.graduated;
    if (!graduated) return [];
    const route: Route = { name: 'still', runId: entry.run.runId };
    return [
      card(
        ctx,
        entry,
        [
          t('ui.shelf.since', { date: shortDate(graduated.day) }),
          ...(graduated.suggestBack ? [t('ui.still.back.said')] : []),
        ],
        [[t(graduated.checkDue ? 'ui.shelf.still' : 'ui.action.bring-back'), route]],
      ),
    ];
  });
