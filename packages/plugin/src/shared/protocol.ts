import type { GameView, Journey } from '@questarc/engine';

import type { Hue } from '../ui/art';
import type { Ladder } from '../ui/ladder';

/**
 * Messages between the view (iframe) and plugin.js. The view posts
 * `PLUGIN_MESSAGE`; Super Productivity hands it to the handler plugin.js
 * set with `PluginAPI.onMessage` and returns its answer
 * (docs/super-productivity-facts.md §1).
 */

export interface State {
  /** Rises with every new evaluation, so the view redraws only on change. */
  readonly revision: number;
  readonly view: GameView;
  readonly journeys: readonly Journey[];
  /** Raw choice records by key, for the screens that edit them. */
  readonly records: Readonly<Record<string, unknown>>;
  /** Whether the side panel setting is on on this device (#100). */
  readonly sidePanel?: boolean;
  /** Once, after the settings button in Super Productivity's plugin list (#67). */
  readonly openSettings?: boolean;
}

/** The ladders' pictures for the view (#100), sent once by plugin.js. */
export interface ArtPack {
  readonly pictures: Readonly<Record<string, string>>;
  readonly ladders: Readonly<Record<string, Ladder>>;
  readonly palette: Readonly<Record<string, Hue>>;
  readonly markers: Readonly<
    Record<string, { readonly title: string; readonly landOnly: boolean }>
  >;
}

export type Request =
  | { readonly type: 'questarc:get' }
  /** Writes choice records; an empty string withdraws one (docs/data-model.md §2). */
  | { readonly type: 'questarc:write'; readonly records: Readonly<Record<string, unknown>> }
  /** Turns the side panel setting of this device on or off. */
  | { readonly type: 'questarc:side-panel'; readonly on: boolean }
  /** The ladders' pictures (an ArtPack). */
  | { readonly type: 'questarc:art' };

export const isRequest = (message: unknown): message is Request => {
  if (typeof message !== 'object' || message === null) return false;
  const { type, records, on } = message as { type?: unknown; records?: unknown; on?: unknown };
  if (type === 'questarc:get' || type === 'questarc:art') return true;
  if (type === 'questarc:side-panel') return typeof on === 'boolean';
  return type === 'questarc:write' && typeof records === 'object' && records !== null;
};
