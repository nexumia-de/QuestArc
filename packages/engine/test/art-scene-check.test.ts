import { describe, expect, it } from 'vitest';
import { sceneProblems } from '../src/art-scene-check';

// The scene checker on a scene that passes, and on broken copies
// (docs/journey-design.md, "Scenes of a region").
const ground = { art: 'ground-field', x: 0, y: 0, width: 320, height: 120 };
const scene = {
  title: 'A stone in a field',
  width: 320,
  height: 120,
  pictures: [
    ground,
    // feet at y + 15/16 of the size: 31.25 + 18.75 = 50
    { art: 'tree', band: 'far', x: 40, y: 31.25, width: 20, height: 20 },
    { art: 'stone', band: 'middle', x: 100, y: 60, width: 24, height: 24 },
    { art: 'stone', band: 'near', x: 270, y: 70, width: 48, height: 48 },
  ],
};
const names = ['ground-field', 'stone', 'tree'];
const places = (value: unknown) => sceneProblems(value, names).map((p) => p.at);
const withPicture = (index: number, change: Record<string, unknown>) => ({
  ...scene,
  pictures: scene.pictures.map((p, i) => (i === index ? { ...p, ...change } : p)),
});

describe('sceneProblems', () => {
  it('passes a scene of known pictures in their bands', () => {
    expect(sceneProblems(scene, names)).toEqual([]);
  });

  it('fails an unknown picture, a missing title and another size', () => {
    expect(places({ ...scene, title: '', width: 640 })).toEqual(['size', 'title']);
    expect(places(withPicture(2, { art: 'tower' }))).toEqual(['pictures[2]']);
  });

  it('wants the ground first, filling the scene, without a band', () => {
    expect(places({ ...scene, pictures: scene.pictures.slice(1) })).toEqual(['pictures[0]']);
    expect(places(withPicture(0, { width: 300 }))).toEqual(['pictures[0]']);
    expect(places(withPicture(0, { band: 'far' }))).toEqual(['pictures[0]']);
    expect(places({ ...scene, pictures: [...scene.pictures, ground] })).toEqual(['pictures[4]']);
  });

  it.each([
    ['no band', { band: undefined }],
    ['an unknown band', { band: 'sky' }],
    ['a size of another band', { width: 48, height: 48, y: 40 }],
    ['a size that is not square', { height: 25 }],
    ['feet in another band', { y: 72 }],
    ['more than half outside', { x: 310 }],
  ])('fails %s', (_name, change) => {
    expect(places(withPicture(2, change))).toEqual(['pictures[2]']);
  });

  it('wants pictures back to front', () => {
    const swapped = { ...scene, pictures: [ground, scene.pictures[3], scene.pictures[2]] };
    expect(places(swapped)).toEqual(['pictures[2]']);
  });
});
