import { defineConfig } from 'vitest/config';

import { viteJourneys } from './journeys.mjs';

// Super Productivity's runtime is a browser; the adapter's tests run in
// Node with a fake plugin API and the UTC time zone.
export default defineConfig({ plugins: [viteJourneys], test: { env: { TZ: 'UTC' } } });
