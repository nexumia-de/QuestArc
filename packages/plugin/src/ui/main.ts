// The view (iframe): asks plugin.js for the game state and draws the
// screens of docs/behaviour.md. It redraws when Super Productivity reports
// a change, when the window comes back, and every few seconds as a fallback.
import type { Hooks } from '@super-productivity/plugin-api';

import startTexts from 'virtual:questarc-start-texts';

import { addTexts, language } from '../shared/texts';
import { createApp } from './app';
import { createClient } from './client';
import { applyContent } from './content';
import { loadErrorText } from './load-error';

const POLL_MS = 5000;
const HOOK_DELAY_MS = 300;
/** Retry sooner while plugin.js is starting. */
const STARTING_RETRY_MS = 1000;

const root = document.getElementById('app') ?? document.body;
const client = createClient();
const app = createApp(root, client);

// The view carries only the texts of its start state; the others, the
// style and the ladders' pictures come from plugin.js once, before the
// first screen (docs/decisions/one-build-for-older-versions.md).
addTexts(startTexts.en);
// German when Super Productivity is German (#39); in the view the call
// returns a promise, and a version without it stays English.
void Promise.resolve()
  .then(() => PluginAPI.getCurrentLanguage?.())
  .then((code) => {
    if (!hasContent && /^de\b/i.test(String(code))) addTexts(startTexts.de);
  })
  .catch(() => undefined);
let hasContent = false;

let loading = false;
let failingSince: number | undefined;
let retry: ReturnType<typeof setTimeout> | undefined;
const load = async (): Promise<void> => {
  if (loading) return;
  loading = true;
  try {
    if (!hasContent) {
      applyContent(await client.content());
      hasContent = true;
    }
    let state = await client.get();
    // plugin.js speaks another language now: its texts first, then the state.
    if (state.language !== undefined && state.language !== language()) {
      applyContent(await client.content());
      state = await client.get();
    }
    app.update(state);
    failingSince = undefined;
  } catch (error) {
    failingSince ??= Date.now();
    const shown = loadErrorText(error, Date.now() - failingSince);
    app.showError(shown.text, shown.detail);
    // One quick retry at a time; the regular polling goes on as well.
    if (shown.problem === 'starting' && retry === undefined) {
      retry = setTimeout(() => {
        retry = undefined;
        void load();
      }, STARTING_RETRY_MS);
    }
  } finally {
    loading = false;
  }
};

// Hooks reach plugin.js too; the short delay lets it mark its data stale
// first, so the answer includes the change.
for (const hook of [
  'dataChanged',
  'persistedDataChanged',
  'dayChange',
  'languageChange',
  'taskUpdate',
  'anyTaskUpdate',
]) {
  // In the view every API call returns a promise; hooks unknown to older
  // versions are rejected there.
  const registered: unknown = PluginAPI.registerHook(hook as Hooks, () => {
    setTimeout(() => void load(), HOOK_DELAY_MS);
  });
  if (registered instanceof Promise) registered.catch(() => undefined);
}
setInterval(() => {
  if (document.visibilityState === 'visible') void load();
}, POLL_MS);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void load();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') app.back();
});
document.addEventListener('click', (event) => {
  if (!(event.target as Element | null)?.closest('.qa-menu-wrap')) app.closeMenu();
});

void load();
