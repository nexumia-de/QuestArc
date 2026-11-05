import { t } from '../../shared/texts';
import { h } from '../dom';

/** Calm or with game (design rule 17): a radio group of two large rows. */
export const modeChoice = (
  selected: 'calm' | 'rpg',
  onChange: (mode: 'calm' | 'rpg') => void,
): HTMLElement => {
  const option = (mode: 'calm' | 'rpg') =>
    h(
      'label',
      { class: 'qa-option' },
      h('input', {
        type: 'radio',
        name: 'qa-mode',
        value: mode,
        checked: mode === selected,
        onchange: () => onChange(mode),
      }),
      h(
        'span',
        { class: 'qa-option-text' },
        h('span', { class: 'qa-option-title' }, t(`ui.mode.${mode}`)),
        h('span', { class: 'qa-muted' }, t(`ui.mode.${mode}.text`)),
      ),
    );
  return h(
    'fieldset',
    { class: 'qa-fieldset' },
    h('legend', { class: 'qa-section-title' }, t('ui.mode.title')),
    option('calm'),
    option('rpg'),
    h('p', { class: 'qa-muted qa-small' }, t('ui.mode.change')),
  ) as HTMLElement;
};
