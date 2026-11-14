import type { PluginAPI } from '@super-productivity/plugin-api';

/**
 * The settings button of QuestArc in Super Productivity's plugin list
 * (#67): `registerConfigHandler` (plugin.js only, in 19.3.0 and 20.0.0)
 * runs a handler when the button is pressed. It opens QuestArc's page
 * and marks a one-shot flag the view reads with its next state, so the
 * page starts on the settings screen (docs/plugin-adapter.md).
 */
export interface SettingsEntry {
  /** True once after the button was pressed; the view's answer takes it. */
  take(): boolean;
}

export const registerSettingsEntry = (
  api: Partial<Pick<PluginAPI, 'registerConfigHandler' | 'showIndexHtmlAsView'>>,
): SettingsEntry => {
  let pending = false;
  try {
    api.registerConfigHandler?.(() => {
      pending = true;
      api.showIndexHtmlAsView?.();
    });
  } catch {
    // This version of Super Productivity has no settings button for plugins.
  }
  return {
    take: () => {
      const was = pending;
      pending = false;
      return was;
    },
  };
};
