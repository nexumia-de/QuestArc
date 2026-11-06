// The module `virtual:questarc-journeys`: every journey file in
// content/journeys/, so a new journey is one new file and nothing else
// (docs/authoring-journeys.md). Used by esbuild (build.mjs) and by
// Vitest (vitest.config.ts); typed in src/virtual-journeys.d.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const id = 'virtual:questarc-journeys';
const dir = join(import.meta.dirname, '..', '..', 'content', 'journeys');

const files = () =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => join(dir, file));

const source = () =>
  `export default ${JSON.stringify(files().map((file) => JSON.parse(readFileSync(file, 'utf8'))))};`;

export const esbuildJourneys = {
  name: 'questarc-journeys',
  setup(build) {
    build.onResolve({ filter: /^virtual:questarc-journeys$/ }, () => ({
      path: id,
      namespace: 'questarc',
    }));
    build.onLoad({ filter: /.*/, namespace: 'questarc' }, () => ({
      contents: source(),
      loader: 'js',
      watchFiles: files(),
      watchDirs: [dir],
    }));
  },
};

export const viteJourneys = {
  name: 'questarc-journeys',
  resolveId: (request) => (request === id ? `\0${id}` : undefined),
  load: (resolved) => (resolved === `\0${id}` ? source() : undefined),
};
