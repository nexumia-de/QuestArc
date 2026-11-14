import type { Journey } from '@questarc/engine';
import type { Hooks, LanguageChangePayload, PluginAPI } from '@super-productivity/plugin-api';

import { useLanguage } from '../shared/languages';

/**
 * The part of the plugin API that tells Super Productivity's language
 * (docs/super-productivity-facts.md §7): `getCurrentLanguage()` and the
 * hook `languageChange`, read at 19.3.1 (`c5eb3f6`); both optional here,
 * so an older version stays English.
 */
export type LanguageApi = Pick<PluginAPI, 'registerHook'> &
  Partial<Pick<PluginAPI, 'getCurrentLanguage'>>;

/**
 * QuestArc follows Super Productivity's language (issue #39): German
 * for "de", English for any other. Read at start and on every
 * `languageChange`; `onChange` runs when the texts are in another
 * language. A host without either member stays English.
 */
export const followLanguage = (
  api: LanguageApi,
  journeys: readonly Journey[],
  onChange: () => void = () => undefined,
): void => {
  const read = (): unknown => {
    try {
      return api.getCurrentLanguage?.();
    } catch {
      return undefined;
    }
  };
  let shown = useLanguage(read(), journeys);
  const changed = (payload?: Partial<LanguageChangePayload>): void => {
    const next = useLanguage(payload?.newLanguage ?? payload?.code ?? read(), journeys);
    if (next === shown) return;
    shown = next;
    onChange();
  };
  try {
    api.registerHook('languageChange' as Hooks, changed as never);
  } catch {
    // Not known to this version of Super Productivity.
  }
};
