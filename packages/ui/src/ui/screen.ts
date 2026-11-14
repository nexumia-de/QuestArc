import type { State } from '../shared/protocol';
import type { ViewHost } from './view-host';

/** What every screen gets and returns (docs/behaviour.md, screens). */

export type Route =
  | { readonly name: 'welcome' }
  | { readonly name: 'home' }
  | { readonly name: 'journey' }
  | { readonly name: 'moment'; readonly anchorId: string; readonly journeyId?: string }
  | { readonly name: 'choose'; readonly anchorId?: string }
  | { readonly name: 'preview'; readonly journeyId: string; readonly anchorId?: string }
  | { readonly name: 'settings' }
  | { readonly name: 'station'; readonly index: number }
  | { readonly name: 'start'; readonly journeyId: string; readonly anchorId?: string }
  | { readonly name: 'setup'; readonly runId?: string }
  | { readonly name: 'pick-task'; readonly runId?: string }
  | { readonly name: 'continue' }
  | { readonly name: 'smaller' }
  | { readonly name: 'finished'; readonly journeyId: string }
  | { readonly name: 'checkin'; readonly runId?: string }
  | { readonly name: 'graduate'; readonly runId: string }
  | { readonly name: 'still'; readonly runId: string }
  | { readonly name: 'shelf' }
  | { readonly name: 'motivates' }
  | { readonly name: 'build' }
  | { readonly name: 'plan-check' }
  | { readonly name: 'stations' };

export interface Context {
  readonly state: State;
  /**
   * Values a screen keeps while it is open (a typed reason, a chosen
   * option), so a redraw after a data change does not lose them.
   */
  readonly draft: Record<string, unknown>;
  go(route: Route): void;
  back(): void;
  /**
   * Replaces the whole navigation stack, e.g. after onboarding; `draft`
   * seeds the new screen's. The journey keeps the home under it, so back
   * leads to the moments.
   */
  reset(route: Route, draft?: Record<string, unknown>): void;
  /** Redraws the current screen, e.g. after it loaded data of its own. */
  redraw(): void;
  /** Writes choice records through plugin.js; the view redraws with the result. */
  write(records: Record<string, unknown>): Promise<void>;
  /** Turns the side panel setting of this device on or off (plugin.js keeps it); only the plugin has one. */
  sidePanel?(on: boolean): Promise<void>;
  /** The host that shows the screens: tasks to list, show and create. */
  readonly host: ViewHost;
}

export interface MenuItem {
  readonly label: string;
  readonly onSelect: () => void;
}

export interface Screen {
  readonly title: string;
  readonly body: Node;
  /** Main actions in the bottom bar, within thumb reach. */
  readonly actions?: readonly Node[];
  /** Hides the settings button, e.g. on the settings screen itself. */
  readonly noSettings?: boolean;
  /** Items of the header menu; Settings is added. Without it, a settings button. */
  readonly menu?: readonly MenuItem[];
  /** `fill`: the screen manages its own scrolling (the journey). */
  readonly layout?: 'scroll' | 'fill';
  /** Called after the screen was opened (not after a redraw). */
  readonly onShow?: () => void;
}
