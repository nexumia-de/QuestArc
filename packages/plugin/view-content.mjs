// What the view does not carry itself (docs/decisions/one-build-for-older-versions.md):
// Super Productivity 19.3 installs an index.html of at most 100 KB, so
// the view holds only what it needs before plugin.js answers.
// - `virtual:questarc-style`: src/ui/style.css without whitespace, as a
//   text for plugin.js, which sends it to the view (`questarc:content`).
// - `virtual:questarc-start-texts`: the few texts of content/i18n/en.json
//   the view shows before that answer, so they exist in one place only.
// For esbuild (build.mjs, preview.mjs) and Vitest (vitest.config.ts);
// typed in src/virtual-content.d.ts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from 'esbuild';

const stylePath = join(import.meta.dirname, 'src', 'ui', 'style.css');
const textsPath = join(import.meta.dirname, '..', '..', 'content', 'i18n', 'en.json');

/** The texts the view shows while it has no answer from plugin.js (src/ui/load-error.ts). */
export const START_TEXT_KEYS = [
  'ui.error.starting',
  'ui.error.not-running',
  'ui.error.failed',
  'ui.error.details',
];

const modules = {
  'virtual:questarc-style': {
    file: stylePath,
    source: async () => {
      const { code } = await transform(readFileSync(stylePath, 'utf8'), {
        loader: 'css',
        minifyWhitespace: true,
      });
      return `export default ${JSON.stringify(code)};`;
    },
  },
  'virtual:questarc-start-texts': {
    file: textsPath,
    source: async () => {
      const texts = JSON.parse(readFileSync(textsPath, 'utf8'));
      const missing = START_TEXT_KEYS.filter((key) => typeof texts[key] !== 'string');
      if (missing.length > 0) throw new Error(`en.json lacks ${missing.join(', ')}`);
      return `export default ${JSON.stringify(
        Object.fromEntries(START_TEXT_KEYS.map((key) => [key, texts[key]])),
      )};`;
    },
  },
};

export const esbuildViewContent = {
  name: 'questarc-view-content',
  setup(build) {
    build.onResolve({ filter: /^virtual:questarc-(style|start-texts)$/ }, ({ path }) => ({
      path,
      namespace: 'questarc-view-content',
    }));
    build.onLoad({ filter: /.*/, namespace: 'questarc-view-content' }, async ({ path }) => ({
      contents: await modules[path].source(),
      loader: 'js',
      watchFiles: [modules[path].file],
    }));
  },
};

export const viteViewContent = {
  name: 'questarc-view-content',
  resolveId: (id) => (Object.hasOwn(modules, id) ? `\0${id}` : undefined),
  load: (id) =>
    id.startsWith('\0') && Object.hasOwn(modules, id.slice(1))
      ? modules[id.slice(1)].source()
      : undefined,
};
