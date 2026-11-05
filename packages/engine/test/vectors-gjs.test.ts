import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadVectors, mismatches } from './vector-support';

/**
 * Runs every vector through the built gjs wrapper (dist/engine-cli.mjs), the
 * way Pensum uses the engine. QUESTARC_GJS names the gjs command (CI sets it;
 * locally see docs/development.md). Without it the test is skipped and says
 * so; CI fails if the variable is set but gjs does not work.
 */
const gjs = process.env.QUESTARC_GJS;
const cli = join(import.meta.dirname, '..', 'dist', 'engine-cli.mjs');
const vectors = loadVectors();

describe.skipIf(!gjs)('test vectors in gjs', () => {
  it('has the built wrapper', () => {
    expect(existsSync(cli)).toBe(true);
  });

  it('gives the expected answer for every vector', () => {
    const batch = vectors.map((v) =>
      v.kind === 'diff' ? { evaluate: v.before } : { evaluate: v.input },
    );
    // diff vectors: evaluate both snapshots, then diff the two views in gjs
    const views = JSON.parse(
      execFileSync(gjs as string, ['-m', cli], {
        input: JSON.stringify({
          batch: [
            ...batch,
            ...vectors.filter((v) => v.kind === 'diff').map((v) => ({ evaluate: v.after })),
          ],
        }),
        encoding: 'utf8',
      }),
    ) as unknown[];
    const afterViews = views.slice(vectors.length);
    const diffRequests = vectors
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v.kind === 'diff')
      .map(({ i }, k) => ({ diff: { before: views[i], after: afterViews[k] } }));
    const diffs = JSON.parse(
      execFileSync(gjs as string, ['-m', cli], {
        input: JSON.stringify({ batch: diffRequests }),
        encoding: 'utf8',
      }),
    ) as unknown[];

    let d = 0;
    const failures = vectors.flatMap((v, i) => {
      const actual = v.kind === 'diff' ? diffs[d++] : views[i];
      return mismatches(v.expect, actual).map((m) => `${v.file} ${m}`);
    });
    expect(failures).toEqual([]);
  });
});
