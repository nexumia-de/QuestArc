import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { journeyProblems } from '../src/content-check';

// Every journey file in content/ must match story format 3 and pass the
// journey checker (docs/authoring-journeys.md). Warnings are printed for
// the reviewer; errors fail CI. `npm run journeys` runs only this file.
const content = join(import.meta.dirname, '..', '..', '..', 'content');
const schema = JSON.parse(readFileSync(join(content, 'schema', 'journey.schema.json'), 'utf8'));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

const files = ['journeys', 'examples'].flatMap((dir) =>
  readdirSync(join(content, dir))
    .filter((file) => file.endsWith('.json'))
    .map((file) => join(content, dir, file)),
);
const journeys = files.map((path) => ({
  path,
  name: `${basename(join(path, '..'))}/${basename(path)}`,
  journey: JSON.parse(readFileSync(path, 'utf8')) as { id?: unknown },
}));
const cases = journeys.map((j) => [j.name, j] as const);

describe('journey files', () => {
  it('exist', () => {
    expect(journeys.length).toBeGreaterThan(1);
  });

  it('have unique ids', () => {
    const ids = journeys.map((j) => j.journey.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(cases)('%s is named after its id', (_n, { path, journey }) => {
    expect(basename(path)).toBe(`${String(journey.id)}.json`);
  });

  it.each(cases)('%s matches the schema', (_n, { journey }) => {
    const valid = validate(journey);
    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it.each(cases)('%s passes the journey checker', (name, { journey }) => {
    const problems = journeyProblems(journey);
    for (const p of problems.filter((p) => p.level === 'warning'))
      console.warn(`${name} ${p.at}: warning: ${p.message}`);
    expect(problems.filter((p) => p.level === 'error')).toEqual([]);
  });
});
