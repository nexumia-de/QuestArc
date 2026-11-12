import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { artProblems } from '../src/art-check';
import { ladderProblems } from '../src/art-ladder-check';
import { paletteProblems } from '../src/art-palette';
import { sceneProblems } from '../src/art-scene-check';

// Every picture and scene in content/art/ must pass the picture checker
// (docs/decisions/shared-pictures.md). `npm run journeys` runs this file.
const dir = join(import.meta.dirname, '..', '..', '..', 'content', 'art');
const files = readdirSync(dir).sort();
const pictures = files.filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
const scenes = files.filter((f) => f.endsWith('.scene.json'));
const ladders = files.filter((f) => f.endsWith('.ladder.json'));
const read = (file: string): unknown => JSON.parse(readFileSync(join(dir, file), 'utf8'));
const palette = read('palette.json') as Record<string, unknown>;

describe('pictures in content/art', () => {
  it('exist', () => {
    expect(pictures.length).toBeGreaterThan(2);
  });

  it('are pictures, scenes, ladders and the palette only', () => {
    const known = (f: string) =>
      f.endsWith('.svg') || f.endsWith('.scene.json') || f.endsWith('.ladder.json');
    expect(files.filter((f) => !known(f))).toEqual(['palette.json']);
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
    expect(ladderProblems(read(file), pictures, Object.keys(palette), sources)).toEqual([]);
  });

  it.each(pictures)('%s passes the picture checker', (name) => {
    expect(artProblems(name, readFileSync(join(dir, `${name}.svg`), 'utf8'))).toEqual([]);
  });

  it.each(scenes)('%s passes the scene checker', (file) => {
    expect(sceneProblems(read(file), pictures)).toEqual([]);
  });
});
