import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';
import { modeChoice } from './mode-choice';

/** Screen 8: mode and what QuestArc stores. */
export const settingsScreen = (ctx: Context): Screen => ({
  title: t('ui.settings.title'),
  noSettings: true,
  body: h(
    'div',
    { class: 'qa-stack' },
    modeChoice(ctx.state.view.mode, (mode) => void ctx.write({ settings: { mode } })),
    h(
      'section',
      { class: 'qa-card' },
      h('h2', { class: 'qa-section-title' }, t('ui.settings.data.title')),
      h('p', { class: 'qa-muted' }, t('ui.settings.data.text')),
    ),
  ),
});
