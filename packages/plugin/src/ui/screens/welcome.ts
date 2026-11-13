import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';

/** Screen 1, first start: what QuestArc does. */
export const welcomeScreen = (ctx: Context): Screen => ({
  title: t('ui.app.name'),
  noSettings: true,
  body: h(
    'div',
    { class: 'qa-stack' },
    h('h2', { class: 'qa-heading' }, t('ui.welcome.title')),
    h('p', {}, t('ui.welcome.what')),
    h('p', {}, t('ui.welcome.how')),
    h(
      'button',
      {
        class: 'qa-btn qa-btn-text qa-link',
        type: 'button',
        onclick: () => ctx.go({ name: 'motivates' }),
      },
      t('ui.settings.motivates'),
    ),
  ),
  actions: [
    h(
      'button',
      {
        class: 'qa-btn qa-btn-primary',
        type: 'button',
        onclick: () => {
          ctx.reset({ name: 'home' });
          ctx.go({ name: 'choose' });
        },
      },
      t('ui.home.choose'),
    ),
  ],
});
