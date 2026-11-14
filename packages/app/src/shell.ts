import { h } from '@questarc/plugin/src/ui/dom';

import { at } from './texts';

/**
 * The app's frame around the screens: one view per tab, the tabs in a
 * bar at the bottom (thumb reach), and a place for one short message,
 * which the plugin leaves to Super Productivity's snack.
 */

export const TABS = ['today', 'journey', 'data'] as const;
export type Tab = (typeof TABS)[number];

export interface Shell {
  readonly views: Readonly<Record<Tab, HTMLElement>>;
  show(tab: Tab): void;
  /** Shows a message for a while, with one action at most. */
  message(text: string, action?: { label: string; run: () => void }): void;
}

const MESSAGE_MS = 8000;

export const createShell = (root: HTMLElement): Shell => {
  const view = () => h('div', { class: 'qa-app app-view', hidden: true }) as HTMLElement;
  const views: Record<Tab, HTMLElement> = { today: view(), journey: view(), data: view() };
  const button = (tab: Tab) =>
    h('button', { class: 'app-tab', type: 'button', onclick: () => show(tab) }, at(`tab.${tab}`));
  const buttons: Record<Tab, Element> = {
    today: button('today'),
    journey: button('journey'),
    data: button('data'),
  };
  const message = h('div', { class: 'app-message', role: 'status', hidden: true }) as HTMLElement;
  let hide: ReturnType<typeof setTimeout> | undefined;

  const show = (tab: Tab): void => {
    for (const name of TABS) {
      views[name].hidden = name !== tab;
      if (name === tab) buttons[name].setAttribute('aria-current', 'page');
      else buttons[name].removeAttribute('aria-current');
    }
  };

  root.replaceChildren(
    ...TABS.map((tab) => views[tab]),
    message,
    h('nav', { class: 'app-tabs' }, ...TABS.map((tab) => buttons[tab])),
  );
  show('today');

  return {
    views,
    show,
    message(text, action) {
      const close = () => {
        message.hidden = true;
      };
      message.replaceChildren(
        h('span', { class: 'app-message-text' }, text),
        ...(action
          ? [
              h(
                'button',
                {
                  class: 'qa-btn qa-btn-secondary',
                  type: 'button',
                  onclick: () => {
                    close();
                    action.run();
                  },
                },
                action.label,
              ),
            ]
          : []),
      );
      message.hidden = false;
      if (hide !== undefined) clearTimeout(hide);
      hide = setTimeout(close, MESSAGE_MS);
    },
  };
};
