import { t } from '../../shared/texts';
import { h } from '../dom';
import type { Context, Screen } from '../screen';
import { modeChoice } from './mode-choice';

/** Screen 1, first start: what QuestArc does, calm or with game. */
export const welcomeScreen = (ctx: Context): Screen => {
  const mode = (ctx.draft.mode as 'calm' | 'rpg' | undefined) ?? 'calm';
  const start = async () => {
    await ctx.write({ settings: { mode } });
    ctx.reset({ name: 'home' });
    ctx.go({ name: 'choose' });
  };
  return {
    title: t('ui.app.name'),
    noSettings: true,
    body: h(
      'div',
      { class: 'qa-stack' },
      h('h2', { class: 'qa-heading' }, t('ui.welcome.title')),
      h('p', {}, t('ui.welcome.what')),
      h('p', {}, t('ui.welcome.how')),
      modeChoice(mode, (m) => {
        ctx.draft.mode = m;
      }),
    ),
    actions: [
      h(
        'button',
        { class: 'qa-btn qa-btn-primary', type: 'button', onclick: start },
        t('ui.home.choose'),
      ),
    ],
  };
};
