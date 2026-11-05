import type { State } from '../shared/protocol';

/** What every screen gets and returns (docs/behaviour.md, screens). */

export type Route =
  | { readonly name: 'welcome' }
  | { readonly name: 'home' }
  | { readonly name: 'choose' }
  | { readonly name: 'preview'; readonly journeyId: string }
  | { readonly name: 'settings' };

export interface Context {
  readonly state: State;
  go(route: Route): void;
  back(): void;
  /** Replaces the whole navigation stack, e.g. after onboarding. */
  reset(route: Route): void;
  /** Writes choice records through plugin.js; the view redraws with the result. */
  write(records: Record<string, unknown>): Promise<void>;
}

export interface Screen {
  readonly title: string;
  readonly body: Node;
  /** Main actions in the bottom bar, within thumb reach. */
  readonly actions?: readonly Node[];
  /** Hides the settings button, e.g. on the settings screen itself. */
  readonly noSettings?: boolean;
}
