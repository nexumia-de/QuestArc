import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Test vectors (packages/engine/vectors/*.json): the engine's examples and
 * edge cases as data, run in Node and in gjs. A vector's `expect` names only
 * the fields it checks; objects match as subsets, arrays element by element
 * with equal length; `null` expects the field to be absent. Journeys written
 * as "$name" come from vectors/journeys. A `guard` vector passes each of its
 * `writes` through guardWrite with the view of its `input`.
 */

const dir = join(import.meta.dirname, '..', 'vectors');

export type Vector =
  | { file: string; name: string; rule: string; kind: 'evaluate'; input: unknown; expect: unknown }
  | {
      file: string;
      name: string;
      rule: string;
      kind: 'guard';
      input: unknown;
      writes: Record<string, unknown>[];
      expect: unknown;
    }
  | {
      file: string;
      name: string;
      rule: string;
      kind: 'diff';
      before: unknown;
      after: unknown;
      expect: unknown;
    };

const journey = (name: string): unknown =>
  JSON.parse(readFileSync(join(dir, 'journeys', `${name}.json`), 'utf8'));

const resolveSnapshot = (snapshot: unknown): unknown => {
  const s = snapshot as { journeys?: unknown[] };
  return {
    ...s,
    journeys: (s.journeys ?? []).map((j) =>
      typeof j === 'string' && j.startsWith('$') ? journey(j.slice(1)) : j,
    ),
  };
};

export const loadVectors = (): Vector[] =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      return raw.kind === 'diff'
        ? { ...raw, file, before: resolveSnapshot(raw.before), after: resolveSnapshot(raw.after) }
        : { ...raw, file, input: resolveSnapshot(raw.input) };
    });

/** Paths where `actual` does not match the expected subset. */
export const mismatches = (expected: unknown, actual: unknown, path = '$'): string[] => {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return [`${path}: expected an array`];
    if (actual.length !== expected.length) {
      return [`${path}: expected ${expected.length} items, got ${actual.length}`];
    }
    return expected.flatMap((item, i) => mismatches(item, actual[i], `${path}[${i}]`));
  }
  if (expected === null) {
    return actual === null || actual === undefined
      ? []
      : [`${path}: expected no value, got ${JSON.stringify(actual)}`];
  }
  if (typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object') return [`${path}: expected an object`];
    return Object.entries(expected).flatMap(([key, value]) =>
      mismatches(value, (actual as Record<string, unknown>)[key], `${path}.${key}`),
    );
  }
  return Object.is(expected, actual)
    ? []
    : [`${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`];
};
