import type { ContentPack, State } from '../shared/protocol';

/**
 * How the screens reach the game: the state derived from the host's data,
 * writing choice records, and the texts and pictures. The plugin's view
 * talks to plugin.js by messages (packages/plugin/src/ui/client.ts), the
 * standalone app asks its brain directly.
 */
export interface Client {
  get(): Promise<State>;
  write(records: Record<string, unknown>): Promise<State>;
  content(): Promise<ContentPack>;
  /** Only the plugin has a side panel; without it the setting is not shown. */
  sidePanel?(on: boolean): Promise<State>;
}
