import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { artProblems } from '../src/art-check';
import { sceneProblems } from '../src/art-scene-check';

// Every picture and scene in content/art/ must pass the picture checker
// (docs/decisions/shared-pictures.md). `npm run journeys` runs this file.
const dir = join(import.meta.dirname, '..', '..', '..', 'content', 'art');
const files = readdirSync(dir).sort();
const pictures = files.filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
const scenes = files.filter((f) => f.endsWith('.scene.json'));

describe('pictures in content/art', () => {
  it('exist', () => {
    expect(pictures.length).toBeGreaterThan(2);
  });

  it('are pictures or scenes only', () => {
    expect(files.filter((f) => !f.endsWith('.svg') && !f.endsWith('.scene.json'))).toEqual([]);
  });

  it.each(pictures)('%s passes the picture checker', (name) => {
    expect(artProblems(name, readFileSync(join(dir, `${name}.svg`), 'utf8'))).toEqual([]);
  });

  it.each(scenes)('%s passes the scene checker', (file) => {
    const scene: unknown = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    expect(sceneProblems(scene, pictures)).toEqual([]);
  });
});
