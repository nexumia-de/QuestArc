import type { PluginAppState } from '@super-productivity/plugin-api';

import type { Context } from './screen';

/**
 * Super Productivity's tasks and repeat configs for screens that list or
 * open them. Loaded once per game-state revision and kept in the screen's
 * draft; the screen redraws when they arrive.
 */
export const appState = (ctx: Context): PluginAppState | undefined => {
  const { draft, state } = ctx;
  if (draft.appRevision !== state.revision && draft.appLoading !== state.revision) {
    draft.appLoading = state.revision;
    void PluginAPI.getAppState()
      .then((app) => {
        draft.app = app;
        draft.appRevision = state.revision;
        ctx.redraw();
      })
      .catch(() => undefined);
  }
  return draft.app as PluginAppState | undefined;
};
