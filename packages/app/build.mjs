// Builds the standalone app (#93, a spike) into dist/app/: static files
// for any web server. app.js bundles the engine, the shared adapter and
// screens, the journeys and the ladders' pictures; app.css is the theme
// (light and dark after the system), the shared style and the app's
// own; sw.js is the service worker with the list of all files.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build, transform } from 'esbuild';
import { esbuildLadderArt } from '../ui/art.mjs';
import { esbuildJourneys } from '../ui/journeys.mjs';

const out = join('dist', 'app');
rmSync('dist', { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const common = { bundle: true, format: 'iife', target: 'es2022', legalComments: 'none' };

await build({
  ...common,
  entryPoints: ['src/main.ts'],
  outfile: join(out, 'app.js'),
  minify: true,
  plugins: [esbuildJourneys, esbuildLadderArt],
});

// The theme variables Super Productivity sets in plugin views, which the
// screens' style reads; the plugin's preview has them too (packages/ui/src/ui/theme.ts).
const theme = await build({
  entryPoints: [join('..', 'ui', 'src', 'ui', 'theme.ts')],
  bundle: true,
  format: 'esm',
  write: false,
});
const { themeCss } = await import(
  `data:text/javascript;base64,${Buffer.from(theme.outputFiles[0].text).toString('base64')}`
);
const style = [
  themeCss('light'),
  `@media (prefers-color-scheme: dark){${themeCss('dark')}}`,
  readFileSync(join('..', 'ui', 'src', 'ui', 'start.css'), 'utf8'),
  readFileSync(join('..', 'ui', 'src', 'ui', 'style.css'), 'utf8'),
  readFileSync(join('src', 'app.css'), 'utf8'),
].join('\n');
const { code: css } = await transform(style, { loader: 'css', minify: true });
writeFileSync(join(out, 'app.css'), css);

for (const file of ['index.html', 'manifest.webmanifest', 'icon.svg']) {
  copyFileSync(join('src', file), join(out, file));
}

// The cache is named after the files' content: a changed build replaces it.
const files = ['index.html', 'app.js', 'app.css', 'manifest.webmanifest', 'icon.svg'];
const hash = createHash('sha256');
for (const file of files) hash.update(readFileSync(join(out, file)));
await build({
  ...common,
  entryPoints: ['src/sw.ts'],
  outfile: join(out, 'sw.js'),
  minify: true,
  define: {
    APP_FILES: JSON.stringify(['./', ...files]),
    APP_CACHE: JSON.stringify(`questarc-${hash.digest('hex').slice(0, 16)}`),
  },
});

let total = 0;
for (const file of [...files, 'sw.js']) {
  const { size } = statSync(join(out, file));
  total += size;
  console.log(`${String(size).padStart(8)}  ${file}`);
}
console.log(`${String(total).padStart(8)}  bytes in ${out}`);
