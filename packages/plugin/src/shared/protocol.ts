import type { GameView, Journey } from '@questarc/engine';

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
}

export type Request =
  | { readonly type: 'questarc:get' }
  /** Writes choice records; an empty string withdraws one (docs/data-model.md §2). */
  | { readonly type: 'questarc:write'; readonly records: Readonly<Record<string, unknown>> };

export const isRequest = (message: unknown): message is Request => {
  if (typeof message !== 'object' || message === null) return false;
  const { type, records } = message as { type?: unknown; records?: unknown };
  if (type === 'questarc:get') return true;
  return type === 'questarc:write' && typeof records === 'object' && records !== null;
};
