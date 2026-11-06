// Builds dist/preview/index.html: the view with a fake plugin API and demo
// data, for screenshots outside Super Productivity (docs/development.md).
// Run after build.mjs, which writes dist/plugin/index.html.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { esbuildJourneys } from './journeys.mjs';

const out = join('dist', 'preview');
mkdirSync(out, { recursive: true });
const view = readFileSync(join('dist', 'plugin', 'index.html'), 'utf8');
const host = await build({
  entryPoints: ['preview/host.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  write: false,
  define: { VIEW_HTML: JSON.stringify(view) },
  plugins: [esbuildJourneys],
});
const script = host.outputFiles[0].text.replaceAll('</script', '<\\/script');
const page = readFileSync('preview/index.html', 'utf8').replace(
  '<!-- PREVIEW_SCRIPT -->',
  () => `<script>\n${script}</script>`,
);
writeFileSync(join(out, 'index.html'), page);
console.log(`Wrote ${join(out, 'index.html')}`);
