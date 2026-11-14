import type { State } from '../shared/protocol';
import { addJourneyTexts, language, t } from '../shared/texts';
import type { Client } from './client';
import { h, icon, ICONS } from './dom';
import type { Context, MenuItem, Route, Screen } from './screen';
import { screenFor } from './screens';

/**
 * The view's shell (issue #30): header with back, title and settings; the
 * screen in the middle, scrolling vertically; the main actions at the
 * bottom. A stack of routes gives back navigation (button, Escape).
 */
export const createApp = (root: HTMLElement, client: Client) => {
  let state: State | undefined;
  let stack: { route: Route; draft: Record<string, unknown> }[] = [];
  let error: { text: string; detail?: string } | undefined;
  let menuOpen = false;

  const entry = (route: Route) => ({ route, draft: {} });
  const firstRoute = (s: State): Route =>
    Object.keys(s.records).length > 0 ? { name: 'home' } : { name: 'welcome' };

  const context = (s: State): Context => ({
    state: s,
    draft: stack.at(-1)?.draft ?? {},
    go: (route) => {
      menuOpen = false;
      stack = [...stack, entry(route)];
      render(true);
    },
    back: () => {
      if (stack.length > 1) stack = stack.slice(0, -1);
      render(true);
    },
    redraw: () => render(false),
    reset: (route, draft = {}) => {
      menuOpen = false;
      stack = [...(route.name === 'journey' ? [entry({ name: 'home' })] : []), { route, draft }];
      render(true);
    },
    write: async (records) => {
      try {
        update(await client.write(records));
      } catch {
        error = { text: t('ui.error.write') };
        render(false);
      }
    },
    sidePanel: async (on) => {
      try {
        update(await client.sidePanel(on));
      } catch {
        error = { text: t('ui.error.write') };
        render(false);
      }
    },
  });

  const settingsButton = (screen: Screen, ctx: Context): Node =>
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
        );

  // The screen's menu (e.g. Pause, End journey) plus Settings, as a list
  // under the header; closed by choosing, Escape or a tap elsewhere.
  const menuButton = (items: readonly MenuItem[], ctx: Context): Node => {
    const all = [
      ...items,
      { label: t('ui.settings.title'), onSelect: () => ctx.go({ name: 'settings' }) },
    ];
    return h(
      'div',
      { class: 'qa-menu-wrap' },
      h(
        'button',
        {
          class: 'qa-icon-btn',
          type: 'button',
          title: t('ui.action.menu'),
          'aria-label': t('ui.action.menu'),
          'aria-haspopup': 'true',
          'aria-expanded': menuOpen ? 'true' : 'false',
          onclick: () => {
            menuOpen = !menuOpen;
            render(false);
          },
        },
        icon(ICONS.menu),
      ),
      menuOpen
        ? h(
            'ul',
            { class: 'qa-menu', role: 'menu' },
            ...all.map((item) =>
              h(
                'li',
                { role: 'none' },
                h(
                  'button',
                  {
                    type: 'button',
                    role: 'menuitem',
                    class: 'qa-menu-item',
                    onclick: () => {
                      menuOpen = false;
                      item.onSelect();
                      render(false);
                    },
                  },
                  item.label,
                ),
              ),
            ),
          )
        : null,
    );
  };

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
      screen.menu ? menuButton(screen.menu, ctx) : settingsButton(screen, ctx),
    ) as HTMLElement;

  const callout = (e: { text: string; detail?: string }): Node =>
    h(
      'div',
      { class: 'qa-callout', role: 'alert' },
      h('p', {}, e.text),
      e.detail ? h('p', { class: 'qa-callout-detail qa-muted' }, e.detail) : null,
    );

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
      screen.body,
    );
    // The message sits between header and screen, so it spans the full
    // width also on screens that fill the page (the journey).
    root.replaceChildren(
      header(screen, ctx),
      ...(error ? [h('div', { class: 'qa-alert-bar' }, callout(error))] : []),
      main,
      ...(screen.actions?.length ? [h('footer', { class: 'qa-actions' }, ...screen.actions)] : []),
    );
    for (const el of root.querySelectorAll<HTMLElement>('.qa-main, [data-scroll-key]')) {
      el.scrollTop = kept.get(el.dataset.scrollKey ?? 'main') ?? 0;
    }
    if (navigated) screen.onShow?.();
  };

  /** The language the screen was drawn in: another one draws it again (#39). */
  let drawnIn = language();
  const update = (next: State): void => {
    // the journeys' own texts come with the state (shared/texts.ts)
    if (next.journeys !== state?.journeys) addJourneyTexts(next.journeys);
    const first = !state;
    // A shown error goes as soon as an answer comes, even when the data
    // did not change in between.
    // The settings button of the plugin list (#67) opens the settings screen
    // on top of where the view is, so back leads there.
    const toSettings = next.openSettings === true && stack.at(-1)?.route.name !== 'settings';
    if (toSettings)
      stack = [
        ...(stack.length > 0 ? stack : [entry(firstRoute(next))]),
        entry({ name: 'settings' }),
      ];
    // A message's Show (flow A) opens the journey on top of the home.
    const toJourney = next.openJourney === true && next.view.active !== undefined;
    if (toJourney) stack = [entry({ name: 'home' }), entry({ name: 'journey' })];
    const changed =
      first ||
      toSettings ||
      toJourney ||
      next.revision !== state?.revision ||
      error !== undefined ||
      drawnIn !== language();
    drawnIn = language();
    state = next;
    error = undefined;
    if (changed) render(first);
  };

  return {
    update,
    /** Opens the journey on top of the home, for a host that shows the view itself. */
    openJourney: () => {
      if (!state?.view.active) return;
      stack = [entry({ name: 'home' }), entry({ name: 'journey' })];
      render(true);
    },
    showError: (text: string, detail?: string) => {
      error = { text, ...(detail ? { detail } : {}) };
      if (state) render(false);
      else root.replaceChildren(callout(error));
    },
    back: () => {
      if (menuOpen) {
        menuOpen = false;
        render(false);
      } else if (state && stack.length > 1) context(state).back();
    },
    closeMenu: () => {
      if (!menuOpen) return;
      menuOpen = false;
      render(false);
    },
  };
};
