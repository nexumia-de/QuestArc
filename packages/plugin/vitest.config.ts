import { defineConfig } from 'vitest/config';

import { viteLadderArt } from './art.mjs';
import { viteJourneys } from './journeys.mjs';

// Super Productivity's runtime is a browser; the adapter's tests run in
// Node with a fake plugin API and the UTC time zone.
export default defineConfig({
  plugins: [viteJourneys, viteLadderArt],
  test: { env: { TZ: 'UTC' } },
});
