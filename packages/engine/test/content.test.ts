import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { journeyProblems, languageProblems } from '../src/content-check';
import { FALLBACK_LANGUAGE, translationProblems } from '../src/texts';
import type { Journey } from '../src/types/journey';

// Every journey file in content/ must match story format 3 and pass the
// journey checker (docs/authoring-journeys.md). Warnings are printed for
// the reviewer; errors fail CI. `npm run journeys` runs this file. The
// languages of content/i18n (issue #39) are checked here too: every
// table has the English keys with the same placeholders, and every
// journey has its texts in each of these languages.
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

const tables = Object.fromEntries(
  readdirSync(join(content, 'i18n'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => [
      basename(file, '.json'),
      JSON.parse(readFileSync(join(content, 'i18n', file), 'utf8')) as Record<string, string>,
    ]),
);
const languages = Object.keys(tables).filter((name) => name !== FALLBACK_LANGUAGE);

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

describe('languages of content/i18n', () => {
  it('include German next to English', () => {
    expect(Object.keys(tables).sort()).toEqual(['de', 'en']);
  });

  it.each(languages)('%s has every English key with the same placeholders', (language) => {
    expect(translationProblems(tables.en ?? {}, tables[language] ?? {})).toEqual([]);
  });

  it.each(cases)('%s has its texts in every language', (_n, { journey }) => {
    expect(languageProblems(journey as Journey, languages)).toEqual([]);
  });
});
