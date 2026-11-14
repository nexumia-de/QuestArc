import { h } from '@questarc/plugin/src/ui/dom';

import { at } from '../texts';

/**
 * Data (#93): the dataset as a backup file, out and in, and the one
 * setting the day needs.
 */

export interface DataProps {
  /** The day start as `HH:MM`. */
  readonly dayStart: string;
  readonly setDayStart: (time: string) => void;
  readonly exportBackup: () => void;
  readonly importBackup: (file: File) => void;
}

export const renderData = (root: HTMLElement, props: DataProps): void => {
  const file = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    hidden: true,
    onchange: (event: Event) => {
      const input = event.target as HTMLInputElement;
      const chosen = input.files?.[0];
      if (chosen) props.importBackup(chosen);
      input.value = '';
    },
  }) as HTMLInputElement;
  const button = (label: string, onclick: () => void) =>
    h('button', { class: 'qa-btn qa-btn-secondary', type: 'button', onclick }, label);

  root.replaceChildren(
    h(
      'header',
      { class: 'qa-header app-header' },
      h('h1', { class: 'qa-title' }, at('data.title')),
    ),
    h(
      'main',
      { class: 'qa-main' },
      h(
        'div',
        { class: 'qa-stack' },
        h('p', {}, at('data.text')),
        h(
          'section',
          { class: 'qa-card qa-stack' },
          button(at('data.export'), props.exportBackup),
          button(at('data.import'), () => file.click()),
          h('p', { class: 'qa-muted qa-small' }, at('data.import.text')),
          file,
        ),
        h(
          'section',
          { class: 'qa-card qa-stack' },
          h(
            'label',
            { class: 'app-field' },
            h('span', { class: 'qa-section-title' }, at('data.day-start')),
            h('input', {
              type: 'time',
              class: 'app-time',
              value: props.dayStart,
              onchange: (event: Event) => {
                const { value } = event.target as HTMLInputElement;
                if (value) props.setDayStart(value);
              },
            }),
          ),
          h('p', { class: 'qa-muted qa-small' }, at('data.day-start.text')),
        ),
      ),
    ),
  );
};
