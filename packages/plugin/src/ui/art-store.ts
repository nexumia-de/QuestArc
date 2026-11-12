import type { ArtPack } from '../shared/protocol';

/**
 * The ladders' pictures in the view (#100). They come from plugin.js once
 * at start (`questarc:art`), not inlined: Super Productivity 19.3.1 takes
 * an index.html of at most 100 KiB (docs/super-productivity-facts.md §1).
 * Until they are here, or if they never come, the build is not drawn and
 * the journey screen shows the path.
 */
const empty: ArtPack = { pictures: {}, ladders: {}, palette: {}, markers: {} };
let pack: ArtPack = empty;

export const setArt = (next: ArtPack): void => {
  pack = next;
};

export const art = (): ArtPack => pack;
