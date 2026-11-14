// Builds dist/preview/index.html: the view with a fake plugin API and demo
// data, for screenshots outside Super Productivity (docs/development.md).
// Run after build.mjs, which writes dist/plugin/index.html.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { esbuildArt, esbuildLadderArt } from '../ui/art.mjs';
import { esbuildJourneys } from '../ui/journeys.mjs';
import { esbuildViewContent } from './view-content.mjs';

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
  plugins: [esbuildJourneys, esbuildLadderArt, esbuildViewContent],
});
const script = host.outputFiles[0].text.replaceAll('</script', '<\\/script');
const page = readFileSync('preview/index.html', 'utf8').replace(
  '<!-- PREVIEW_SCRIPT -->',
  () => `<script>\n${script}</script>`,
);
writeFileSync(join(out, 'index.html'), page);
console.log(`Wrote ${join(out, 'index.html')}`);

// The picture spike's page (#86): scene and single pictures, no plugin API.
const art = await build({
  entryPoints: ['preview/art.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  write: false,
  plugins: [esbuildArt],
});
const style = ['start.css', 'style.css']
  .map((file) => readFileSync(join('..', 'ui', 'src', 'ui', file), 'utf8'))
  .join('\n');
writeFileSync(
  join(out, 'art.html'),
  `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>QuestArc pictures</title><style>\n${style}</style></head><body>\n<script>\n${art.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>\n`,
);
console.log(`Wrote ${join(out, 'art.html')}`);
