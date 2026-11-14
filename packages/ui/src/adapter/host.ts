import type { PluginAPI } from '@super-productivity/plugin-api';

/**
 * The part of Super Productivity's plugin API the adapter uses, so tests
 * can pass a fake. Members that older versions lack stay optional
 * (docs/super-productivity-facts.md §3, §9).
 */
export type HostApi = Pick<
  PluginAPI,
  | 'getAppState'
  | 'getArchivedTasks'
  | 'listSyncedDataKeys'
  | 'loadSyncedData'
  | 'persistDataSynced'
  | 'showSnack'
  | 'registerHook'
> &
  Partial<Pick<PluginAPI, 'getDayContext' | 'onWindowFocusChange' | 'onUnload'>>;
