// The view (iframe): asks plugin.js for the game state and draws the
// screens of docs/behaviour.md. It redraws when Super Productivity reports
// a change, when the window comes back, and every few seconds as a fallback.
import type { Hooks } from '@questarc/sp-plugin-api';

import { t } from '../shared/texts';
import { createApp } from './app';
import { createClient } from './client';

const POLL_MS = 5000;
const HOOK_DELAY_MS = 300;

const root = document.getElementById('app') ?? document.body;
const client = createClient();
const app = createApp(root, client);

let loading = false;
const load = async (): Promise<void> => {
  if (loading) return;
  loading = true;
  try {
    app.update(await client.get());
  } catch {
    app.showError(t('ui.error.load'));
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

void load();
