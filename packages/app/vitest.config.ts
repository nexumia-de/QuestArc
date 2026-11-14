import { defineConfig } from 'vitest/config';

import { viteLadderArt } from '../plugin/art.mjs';
import { viteJourneys } from '../plugin/journeys.mjs';

// The store and the host run in Node with a store kept in memory; the
// IndexedDB part and the screens are tried in a browser (e2e/walk.mjs).
export default defineConfig({
  plugins: [viteJourneys, viteLadderArt],
  test: { env: { TZ: 'UTC' } },
});
