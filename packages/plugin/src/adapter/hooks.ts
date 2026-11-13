import type { Hooks } from '@questarc/sp-plugin-api';

import type { Invalidate } from './brain';
import type { HostApi } from './host';

/**
 * Which hooks make the game recompute, and what they invalidate
 * (docs/super-productivity-facts.md §3). `dataChanged` and `dayChange`
 * exist since Super Productivity 20.0.0 and cover remote sync; older
 * versions reject unknown hooks, so each is registered on its own and the
 * local task hooks and window focus are the fallback.
 */
export const HOOKS: readonly (readonly [string, Invalidate])[] = [
  ['dataChanged', 'tasks'],
  ['dayChange', 'archive'],
  ['persistedDataChanged', 'records'],
  ['finishDay', 'archive'],
  ['taskComplete', 'tasks'],
  ['taskUpdate', 'tasks'],
  ['taskDelete', 'tasks'],
  ['anyTaskUpdate', 'tasks'],
];

/** Registers the hooks; returns the names the host accepted. */
export const registerHooks = (api: HostApi, refresh: (what: Invalidate) => void): string[] => {
  const accepted: string[] = [];
  for (const [hook, what] of HOOKS) {
    try {
      api.registerHook(hook as Hooks, () => refresh(what));
      accepted.push(hook);
    } catch {
      // Not known to this version of Super Productivity.
    }
  }
  // Remote changes reach older versions without dataChanged only when the
  // user comes back to the window.
  api.onWindowFocusChange?.((focused) => {
    if (focused) refresh('archive');
  });
  return accepted;
};
