import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';

// Every journey in content/ must match story format 3 and have an English
// text for each key it uses (docs/story-format.md).
const content = join(import.meta.dirname, '..', '..', '..', 'content');
const schema = JSON.parse(readFileSync(join(content, 'schema', 'journey.schema.json'), 'utf8'));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

/** Journey folders with the English texts their journeys use. */
const folders = [
  { dir: join(content, 'journeys'), texts: join(content, 'i18n', 'en.json') },
  { dir: join(content, 'examples'), texts: join(content, 'examples', 'en.json') },
].filter(({ dir }) => existsSync(dir));

const journeys = folders.flatMap(({ dir, texts }) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.json') && file !== 'en.json')
    .map((file) => ({ file, journey: readJson(join(dir, file)), texts })),
);

const textKeys = (value: unknown, key = ''): string[] => {
  if (typeof value === 'string') {
    const isText = ['title', 'description', 'why', 'anchor', 'action', 'place', 'name'];
    return isText.includes(key) || ['arrival', 'accept', 'story', 'nugget'].includes(key)
      ? [value]
      : [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => textKeys(item));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => textKeys(v, k));
  }
  return [];
};

describe('journeys', () => {
  it('exist', () => {
    expect(journeys.length).toBeGreaterThan(0);
  });

  it.each(journeys.map((j) => [j.file, j] as const))('%s matches the schema', (_f, { journey }) => {
    const valid = validate(journey);
    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it.each(journeys.map((j) => [j.file, j] as const))(
    '%s has an English text for every key',
    (_f, { journey, texts }) => {
      const english = readJson(texts) as Record<string, string>;
      const missing = textKeys(journey).filter((key) => !english[key]);
      expect(missing).toEqual([]);
    },
  );

  it.each(journeys.map((j) => [j.file, j] as const))(
    '%s has unique stage ids and sensible conditions',
    (_f, { journey }) => {
      const stages = (
        journey as { stages: { id: string; condition: { n?: number; of?: number } }[] }
      ).stages;
      expect(new Set(stages.map((s) => s.id)).size).toBe(stages.length);
      for (const { condition } of stages) {
        if (condition.of !== undefined) expect(condition.n).toBeLessThanOrEqual(condition.of);
      }
    },
  );
});
