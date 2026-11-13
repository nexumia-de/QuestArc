import type { PluginAPI } from '@super-productivity/plugin-api';

/**
 * The optional side panel (docs/behaviour.md screen 8, #100): with the
 * setting on, Super Productivity gets QuestArc's side-panel button, which
 * opens the view beside the task list. The setting belongs to this device
 * (localStorage of the app); a plugin cannot remove the button again, so
 * turning it off takes effect at the next start
 * (docs/super-productivity-facts.md §7).
 */
const KEY = 'questarc:side-panel';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

const safe = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export interface SidePanel {
  /** Whether the setting is on on this device. */
  readonly on: boolean;
  set(on: boolean): void;
}

export const createSidePanel = (
  api: Pick<PluginAPI, 'registerSidePanelButton'>,
  storage: Storage | undefined = safe(),
): SidePanel => {
  const read = (): boolean => {
    try {
      return storage?.getItem(KEY) === '1';
    } catch {
      return false;
    }
  };
  let registered = false;
  const register = () => {
    if (registered) return;
    registered = true;
    // the host toggles the panel itself; nothing else to do on a click
    api.registerSidePanelButton({ label: 'QuestArc', icon: 'route', onClick: () => undefined });
  };
  let on = read();
  if (on) register();
  return {
    get on() {
      return on;
    },
    set(value: boolean) {
      on = value;
      try {
        storage?.setItem(KEY, value ? '1' : '0');
      } catch {
        // Storage blocked: the setting lasts until the app closes.
      }
      if (value) register();
    },
  };
};
