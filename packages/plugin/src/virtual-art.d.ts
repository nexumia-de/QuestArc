// Every picture and scene in content/art/, built by art.mjs.
declare module 'virtual:questarc-art' {
  import type { Scene } from './ui/art';

  export const pictures: Readonly<Record<string, string>>;
  export const scenes: Readonly<Record<string, Scene>>;
}
