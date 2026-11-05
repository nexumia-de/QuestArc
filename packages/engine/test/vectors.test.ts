import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { evaluate } from '../src';
import type { GameView, Snapshot } from '../src';

interface Vector {
  name: string;
  input: Snapshot;
  expected: GameView;
}

const dir = join(import.meta.dirname, '..', 'vectors');
const vectors: Vector[] = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')) as Vector);

describe('test vectors', () => {
  it('exist', () => {
    expect(vectors.length).toBeGreaterThan(0);
  });

  it.each(vectors.map((v) => [v.name, v] as const))('%s', (_name, vector) => {
    expect(evaluate(vector.input)).toEqual(vector.expected);
  });
});
