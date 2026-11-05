// Builds the engine as one dependency-free ES module (dist/engine.mjs)
// and the gjs command-line wrapper (dist/engine-cli.mjs).
import { build } from 'esbuild';

const common = {
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  legalComments: 'none',
  logLevel: 'info',
};

await build({ ...common, entryPoints: ['src/index.ts'], outfile: 'dist/engine.mjs' });
await build({
  ...common,
  entryPoints: ['src/cli-gjs.ts'],
  outfile: 'dist/engine-cli.mjs',
  external: ['gi://*'],
});
