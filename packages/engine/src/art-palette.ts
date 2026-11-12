import type { Problem } from './content-check';

/**
 * The region palette (content/art/palette.json, #42): about eight named
 * hues, each with a light and a dark value. In a scene of a region,
 * `accent`, `tint` and `tint-strong` come from the region's hue; `fg`,
 * `bg` and `dim` stay the host's. Any hue must stay readable in both
 * styles and both hosts, so the values are checked here by computation
 * (WCAG 2.2 relative luminance), not by eye.
 */

/**
 * The hosts' card backgrounds, where scenes are drawn: Super
 * Productivity's `--bg-lighter` (white, rgb(51, 51, 51)) and libadwaita's
 * card on the window (white on #fafafb; 8 % white on #222226 = #343437,
 * on #242424 before 1.6 = #383838), plus the dark window itself.
 */
export const HOST_CARDS = {
  light: ['#ffffff', '#fafafb'],
  dark: ['#333333', '#343437', '#383838', '#222226'],
} as const;

/** The hosts' text colours (`fg`, the outlines), made opaque on their cards. */
export const HOST_TEXT = {
  light: ['#2c2c2c', '#333338'],
  dark: ['#e6e6e6', '#ffffff'],
} as const;

/**
 * Minimum contrasts. `accent` details (the light, a window, a keystone)
 * are graphics that must be seen: 3 : 1 against the card (WCAG 1.4.11,
 * non-text contrast). `tint-strong` (water, near banks, growth) is
 * decorative, but the river has to be there: 1.5 : 1. The outlines (`fg`)
 * of a build stand on `tint-strong` water and must read: 3 : 1. `tint`
 * (16 %) is the quiet ground and is not tested (about 1.1 : 1).
 */
export const PALETTE_MIN = { accent: 3, tintStrong: 1.5, outlineOnTintStrong: 3 } as const;

/** The share of the hue in `tint-strong`, as in both hosts. */
export const TINT_STRONG_SHARE = 0.4;

type Rgb = readonly [number, number, number];
const HEX = /^#[0-9a-f]{6}$/;

export const rgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** WCAG relative luminance of an sRGB colour (0–255 channels). */
export const luminance = ([r, g, b]: Rgb): number => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** WCAG contrast ratio of two colours, from 1 to 21. */
export const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** `top` mixed into `below` at `share`, as color-mix in srgb does. */
export const mix = (top: Rgb, below: Rgb, share: number): Rgb => {
  const one = (t: number, b: number) => Math.round(t * share + b * (1 - share));
  return [one(top[0], below[0]), one(top[1], below[1]), one(top[2], below[2])];
};

/** Problems of palette.json: names, values and every contrast in PALETTE_MIN. */
export const paletteProblems = (value: unknown): Problem[] => {
  const problems: Problem[] = [];
  const error = (at: string, message: string) => problems.push({ level: 'error', at, message });
  const palette = (value ?? {}) as Record<string, Record<string, unknown>>;
  const names = Object.keys(palette);
  if (names.length < 6 || names.length > 10) error('palette', 'six to ten hues');
  for (const name of names) {
    const hue = palette[name] ?? {};
    if (!/^[a-z]+$/.test(name)) error(name, 'a lower-case word');
    if (typeof hue.title !== 'string' || hue.title.trim() === '') error(name, 'the hue in words');
    for (const style of ['light', 'dark'] as const) {
      const at = `${name}.${style}`;
      const value = hue[style];
      if (typeof value !== 'string' || !HEX.test(value)) {
        error(at, 'a colour #rrggbb in lower case');
        continue;
      }
      const colour = rgb(value);
      for (const card of HOST_CARDS[style]) {
        const below = rgb(card);
        const strong = mix(colour, below, TINT_STRONG_SHARE);
        const accent = contrast(colour, below);
        if (accent < PALETTE_MIN.accent)
          error(at, `accent ${accent.toFixed(2)} : 1 on ${card}; at least ${PALETTE_MIN.accent}`);
        const water = contrast(strong, below);
        if (water < PALETTE_MIN.tintStrong)
          error(
            at,
            `tint-strong ${water.toFixed(2)} : 1 on ${card}; at least ${PALETTE_MIN.tintStrong}`,
          );
        for (const text of HOST_TEXT[style]) {
          const outline = contrast(rgb(text), strong);
          if (outline < PALETTE_MIN.outlineOnTintStrong)
            error(
              at,
              `outline ${text} on its tint-strong ${outline.toFixed(2)} : 1 (card ${card}); at least ${PALETTE_MIN.outlineOnTintStrong}`,
            );
        }
      }
    }
  }
  return problems;
};
