import { describe, expect, it } from 'vitest';
import { contrast, luminance, mix, paletteProblems, rgb } from '../src/art-palette';

// The palette check (docs/decisions/shared-pictures.md, "Colours per
// region"): WCAG contrast computed, thresholds in PALETTE_MIN.
const hue = (light: string, dark: string) => ({ title: 'A hue', light, dark });
const good = {
  meadow: hue('#3d8a3a', '#7cc576'),
  water: hue('#2f74b5', '#72b2ec'),
  sand: hue('#956a12', '#d8b25a'),
  heather: hue('#8650ab', '#c39be4'),
  rust: hue('#b4502a', '#ec9064'),
  slate: hue('#56697f', '#9fb1c6'),
};

describe('contrast', () => {
  it('follows WCAG: black on white is 21, a colour on itself 1', () => {
    expect(contrast(rgb('#000000'), rgb('#ffffff'))).toBeCloseTo(21, 5);
    expect(contrast(rgb('#2f74b5'), rgb('#2f74b5'))).toBe(1);
    expect(luminance(rgb('#ffffff'))).toBeCloseTo(1, 5);
    // #767676 on white is the well-known 4.54 : 1
    expect(contrast(rgb('#767676'), rgb('#ffffff'))).toBeCloseTo(4.54, 2);
  });

  it('mixes like color-mix in srgb', () => {
    expect(mix(rgb('#ff0000'), rgb('#ffffff'), 0.4)).toEqual([255, 153, 153]);
  });
});

describe('paletteProblems', () => {
  it('passes hues that keep their contrasts', () => {
    expect(paletteProblems(good)).toEqual([]);
  });

  it('fails a light value too pale for a white card', () => {
    const text = paletteProblems({ ...good, sand: hue('#e0c890', '#d8b25a') })
      .map((p) => `${p.at} ${p.message}`)
      .join('\n');
    expect(text).toMatch(/sand\.light accent .* on #ffffff/);
  });

  it('fails a dark value too dark for a dark card', () => {
    const text = paletteProblems({ ...good, slate: hue('#56697f', '#34465a') })
      .map((p) => `${p.at} ${p.message}`)
      .join('\n');
    expect(text).toMatch(/slate\.dark accent/);
  });

  it('fails a bad colour, a missing title and too few hues', () => {
    const at = paletteProblems({ meadow: { light: 'green', dark: '#7cc576' } }).map((p) => p.at);
    expect(at).toEqual(expect.arrayContaining(['palette', 'meadow', 'meadow.light']));
  });
});
