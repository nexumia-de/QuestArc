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
  let stack: { route: Route; draft: Record<string, unknown> }[] = [];
  let error: string | undefined;

  const entry = (route: Route) => ({ route, draft: {} });
  const firstRoute = (s: State): Route =>
    'settings' in s.records ? { name: 'home' } : { name: 'welcome' };

  const context = (s: State): Context => ({
    state: s,
    draft: stack.at(-1)?.draft ?? {},
    go: (route) => {
      stack = [...stack, entry(route)];
      render(true);
    },
    back: () => {
      if (stack.length > 1) stack = stack.slice(0, -1);
      render(true);
    },
    redraw: () => render(false),
    reset: (route) => {
      stack = [entry(route)];
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
    if (stack.length === 0) stack = [entry(firstRoute(state))];
    const ctx = context(state);
    const current = stack.at(-1);
    if (!current) return;
    const screen = screenFor(current.route, ctx);
    // A redraw keeps the scroll positions of the page and of inner
    // scrolling parts (marked with data-scroll-key); navigation resets them.
    const kept = new Map<string, number>();
    if (!navigated) {
      for (const el of root.querySelectorAll<HTMLElement>('.qa-main, [data-scroll-key]')) {
        kept.set(el.dataset.scrollKey ?? 'main', el.scrollTop);
      }
    }
    const main = h(
      'main',
      { class: screen.layout === 'fill' ? 'qa-main qa-main-fill' : 'qa-main' },
      error ? h('p', { class: 'qa-callout', role: 'alert' }, error) : null,
      screen.body,
    );
    root.replaceChildren(
      header(screen, ctx),
      main,
      ...(screen.actions?.length ? [h('footer', { class: 'qa-actions' }, ...screen.actions)] : []),
    );
    for (const el of root.querySelectorAll<HTMLElement>('.qa-main, [data-scroll-key]')) {
      el.scrollTop = kept.get(el.dataset.scrollKey ?? 'main') ?? 0;
    }
    if (navigated) screen.onShow?.();
  };

  const update = (next: State): void => {
    const first = !state;
    const changed = first || next.revision !== state?.revision;
    state = next;
    error = undefined;
    if (changed) render(first);
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
