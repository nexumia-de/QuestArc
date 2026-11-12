// Every picture, scene and ladder in content/art/ and the palette, built by art.mjs.
declare module 'virtual:questarc-art' {
  import type { Hue, Scene } from './ui/art';
  import type { Ladder } from './ui/ladder';

  export const pictures: Readonly<Record<string, string>>;
  export const scenes: Readonly<Record<string, Scene>>;
  export const ladders: Readonly<Record<string, Ladder>>;
  export const palette: Readonly<Record<string, Hue>>;
  /** The marker kinds (markers.json): what can hang on a marker. */
  export const markers: Readonly<
    Record<string, { readonly title: string; readonly landOnly: boolean }>
  >;
}
