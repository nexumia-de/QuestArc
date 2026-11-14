import { language } from '@questarc/plugin/src/shared/texts';
import { h } from '@questarc/plugin/src/ui/dom';

import type { StoredTask } from '../store/dataset';
import { at } from '../texts';

/**
 * Today (#93): the habits due today, each ticked off with one tap and
 * opened again with another. A task left open from an earlier day says
 * from when; the app has no other tasks.
 */

export interface TodayProps {
  readonly today: string;
  readonly tasks: readonly StoredTask[];
  /** Whether any habit exists; without one the screen points to the journey. */
  readonly hasHabits: boolean;
  readonly toggle: (task: StoredTask) => void;
  readonly openJourney: () => void;
}

const CHECK = 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z';

const row = (task: StoredTask, props: TodayProps): Node =>
  h(
    'li',
    {},
    h(
      'button',
      {
        class: 'qa-card qa-card-button app-habit',
        type: 'button',
        role: 'checkbox',
        'aria-checked': task.isDone ? 'true' : 'false',
        title: at(task.isDone ? 'today.done' : 'today.open'),
        onclick: () => props.toggle(task),
      },
      h(
        'span',
        { class: 'app-check', 'aria-hidden': 'true' },
        task.isDone
          ? h('svg', { viewBox: '0 0 24 24', width: 20, height: 20 }, h('path', { d: CHECK }))
          : null,
      ),
      h(
        'span',
        { class: 'qa-option-text' },
        h('span', { class: 'qa-plan' }, task.title),
        task.dueDay && task.dueDay < props.today
          ? h('span', { class: 'qa-muted qa-small' }, at('today.earlier', { day: task.dueDay }))
          : null,
      ),
    ),
  );

export const renderToday = (root: HTMLElement, props: TodayProps): void => {
  const date = new Date(`${props.today}T12:00:00`).toLocaleDateString(
    language() === 'de' ? 'de-DE' : undefined,
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    },
  );
  root.replaceChildren(
    h('header', { class: 'qa-header app-header' }, h('h1', { class: 'qa-title' }, at('tab.today'))),
    h(
      'main',
      { class: 'qa-main' },
      h(
        'div',
        { class: 'qa-stack' },
        h('p', { class: 'qa-muted' }, date),
        props.tasks.length > 0
          ? h('ul', { class: 'qa-list app-habits' }, ...props.tasks.map((task) => row(task, props)))
          : h('p', {}, at('today.empty')),
        props.hasHabits ? null : h('p', { class: 'qa-muted' }, at('today.none')),
      ),
    ),
    ...(props.hasHabits
      ? []
      : [
          h(
            'footer',
            { class: 'qa-actions' },
            h(
              'button',
              { class: 'qa-btn qa-btn-primary', type: 'button', onclick: props.openJourney },
              at('today.open-journey'),
            ),
          ),
        ]),
  );
};
