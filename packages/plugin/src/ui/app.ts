import type { State } from '../shared/protocol';
import { t } from '../shared/texts';
import type { Client } from './client';
import { h, icon, ICONS } from './dom';
import type { Context, Route, Screen } from './screen';
import { screenFor } from './screens';

/**
 * The view's shell (issue #30): header with back, title and settings; the
 * screen in the middle, scrolling vertically; the main actions at the
 * bottom. A stack of routes gives back navigation (button, Escape).
 */
export const createApp = (root: HTMLElement, client: Client) => {
  let state: State | undefined;
  let stack: Route[] = [];
  let error: string | undefined;

  const firstRoute = (s: State): Route =>
    'settings' in s.records ? { name: 'home' } : { name: 'welcome' };

  const context = (s: State): Context => ({
    state: s,
    go: (route) => {
      stack = [...stack, route];
      render(true);
    },
    back: () => {
      if (stack.length > 1) stack = stack.slice(0, -1);
      render(true);
    },
    reset: (route) => {
      stack = [route];
      render(true);
    },
    write: async (records) => {
      try {
        update(await client.write(records));
      } catch {
        error = t('ui.error.write');
        render(false);
      }
    },
  });

  const header = (screen: Screen, ctx: Context): HTMLElement =>
    h(
      'header',
      { class: 'qa-header' },
      stack.length > 1
        ? h(
            'button',
            {
              class: 'qa-icon-btn',
              type: 'button',
              title: t('ui.action.back'),
              'aria-label': t('ui.action.back'),
              onclick: ctx.back,
            },
            icon(ICONS.back),
          )
        : h('span', { class: 'qa-header-spacer' }),
      h('h1', { class: 'qa-title' }, screen.title),
      screen.noSettings
        ? h('span', { class: 'qa-header-spacer' })
        : h(
            'button',
            {
              class: 'qa-icon-btn',
              type: 'button',
              title: t('ui.settings.title'),
              'aria-label': t('ui.settings.title'),
              onclick: () => ctx.go({ name: 'settings' }),
            },
            icon(ICONS.settings),
          ),
    ) as HTMLElement;

  const render = (navigated: boolean): void => {
    if (!state) return;
    if (stack.length === 0) stack = [firstRoute(state)];
    const ctx = context(state);
    const screen = screenFor(stack[stack.length - 1] as Route, ctx);
    const previous = root.querySelector('.qa-main');
    const scrollTop = navigated ? 0 : (previous?.scrollTop ?? 0);
    const main = h(
      'main',
      { class: 'qa-main' },
      error ? h('p', { class: 'qa-callout', role: 'alert' }, error) : null,
      screen.body,
    );
    root.replaceChildren(
      header(screen, ctx),
      main,
      ...(screen.actions?.length ? [h('footer', { class: 'qa-actions' }, ...screen.actions)] : []),
    );
    main.scrollTop = scrollTop;
  };

  const update = (next: State): void => {
    const changed = !state || next.revision !== state.revision;
    state = next;
    error = undefined;
    if (changed) render(false);
  };

  return {
    update,
    showError: (text: string) => {
      error = text;
      if (state) render(false);
      else root.replaceChildren(h('p', { class: 'qa-callout', role: 'alert' }, text));
    },
    back: () => {
      if (state && stack.length > 1) context(state).back();
    },
  };
};
