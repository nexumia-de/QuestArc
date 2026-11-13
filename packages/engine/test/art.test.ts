import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { artProblems } from '../src/art-check';
import { ladderProblems, markerProblems, type MarkerKind } from '../src/art-ladder-check';
import { paletteProblems } from '../src/art-palette';

// Every picture and ladder in content/art/ must pass the picture checker
// (docs/decisions/shared-pictures.md). `npm run journeys` runs this file.
const dir = join(import.meta.dirname, '..', '..', '..', 'content', 'art');
const files = readdirSync(dir).sort();
const pictures = files.filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
const ladders = files.filter((f) => f.endsWith('.ladder.json'));
const read = (file: string): unknown => JSON.parse(readFileSync(join(dir, file), 'utf8'));
const palette = read('palette.json') as Record<string, unknown>;
const markers = read('markers.json') as Record<string, MarkerKind>;

describe('pictures in content/art', () => {
  it('exist', () => {
    expect(pictures.length).toBeGreaterThan(2);
  });

  it('are pictures, ladders, the markers and the palette only', () => {
    const known = (f: string) => f.endsWith('.svg') || f.endsWith('.ladder.json');
    expect(files.filter((f) => !known(f))).toEqual(['markers.json', 'palette.json']);
  });

  it('have the markers lanterns, bunting and flowers, each with its pictures', () => {
    expect(Object.keys(markers)).toEqual(['lanterns', 'bunting', 'flowers']);
    expect(markerProblems(markers, pictures)).toEqual([]);
  });

  it('have a palette whose every hue keeps its contrasts in both styles', () => {
    expect(paletteProblems(palette)).toEqual([]);
  });

  it('have the ladders crossing and home', () => {
    expect(ladders).toEqual(['crossing.ladder.json', 'home.ladder.json']);
  });

  it.each(ladders)('%s passes the ladder checker', (file) => {
    const sources = Object.fromEntries(
      pictures.map((name) => [name, readFileSync(join(dir, `${name}.svg`), 'utf8')]),
    );
    expect(ladderProblems(read(file), pictures, Object.keys(palette), markers, sources)).toEqual(
      [],
    );
  });

  it.each(pictures)('%s passes the picture checker', (name) => {
    expect(artProblems(name, readFileSync(join(dir, `${name}.svg`), 'utf8'))).toEqual([]);
  });
});
