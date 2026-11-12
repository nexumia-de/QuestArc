import { describe, expect, it } from 'vitest';

import { diff, evaluate, guardWrite } from '../src';
import type { GameView, Snapshot } from '../src';
import { loadVectors, mismatches } from './vector-support';

const vectors = loadVectors();

describe('test vectors in Node', () => {
  it('exist', () => {
    expect(vectors.length).toBeGreaterThan(20);
  });

  it.each(vectors.map((v) => [v.file, v] as const))('%s', (_file, vector) => {
    const actual =
      vector.kind === 'diff'
        ? diff(evaluate(vector.before as Snapshot), evaluate(vector.after as Snapshot))
        : vector.kind === 'guard'
          ? vector.writes.map((changes) => guardWrite(evaluate(vector.input as Snapshot), changes))
          : evaluate(vector.input as Snapshot);
    expect(mismatches(vector.expect, actual)).toEqual([]);
  });

  it('are deterministic', () => {
    for (const vector of vectors) {
      if (vector.kind === 'diff') continue;
      const a: GameView = evaluate(vector.input as Snapshot);
      const b: GameView = evaluate(structuredClone(vector.input) as Snapshot);
      expect(b).toEqual(a);
    }
  });
});
