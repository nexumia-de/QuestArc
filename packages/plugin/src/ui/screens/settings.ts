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
      'button',
      {
        class: 'qa-card qa-card-button',
        type: 'button',
        onclick: () => ctx.go({ name: 'motivates' }),
      },
      h('span', { class: 'qa-section-title' }, t('ui.settings.motivates')),
      h('span', { class: 'qa-muted' }, t('ui.settings.motivates.text')),
    ),
    h(
      'section',
      { class: 'qa-card' },
      h('h2', { class: 'qa-section-title' }, t('ui.settings.data.title')),
      h('p', { class: 'qa-muted' }, t('ui.settings.data.text')),
      removeData(ctx),
    ),
  ),
});

/**
 * Removes QuestArc's own records, never tasks (issue #32). It cannot be
 * undone, so it asks first, in place (AGENTS.md: ask only when undo is
 * impossible).
 */
const removeData = (ctx: Context): Node => {
  const keys = Object.keys(ctx.state.records);
  if (keys.length === 0) return h('p', { class: 'qa-muted qa-small' }, t('ui.settings.data.none'));
  if (!ctx.draft.confirmRemove) {
    return h(
      'button',
      {
        class: 'qa-btn qa-btn-secondary',
        type: 'button',
        onclick: () => {
          ctx.draft.confirmRemove = true;
          ctx.redraw();
        },
      },
      t('ui.settings.data.remove'),
    );
  }
  return h(
    'div',
    { class: 'qa-stack' },
    h('p', { role: 'alert' }, t('ui.settings.data.confirm')),
    h(
      'button',
      {
        class: 'qa-btn qa-btn-danger',
        type: 'button',
        onclick: async () => {
          await ctx.write(Object.fromEntries(keys.map((key) => [key, ''])));
          ctx.reset({ name: 'welcome' });
        },
      },
      t('ui.settings.data.remove-now'),
    ),
    h(
      'button',
      {
        class: 'qa-btn qa-btn-text',
        type: 'button',
        onclick: () => {
          ctx.draft.confirmRemove = false;
          ctx.redraw();
        },
      },
      t('ui.action.cancel'),
    ),
  );
};
