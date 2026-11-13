/**
 * The depth bands of a drawn place (docs/journey-design.md, "Depth
 * bands"): a picture stands in one of three bands and has one of the
 * band's sizes (large, medium, small things), so every setting keeps the
 * same perspective. The far band is drawn as one silhouette in `tint` by
 * the hosts. Where the feet stand is the setting's own
 * (art-ladder-check.ts, `SETTING_FEET`).
 */
export type Band = 'far' | 'middle' | 'near';

export const BAND_SIZES: Readonly<Record<Band, readonly number[]>> = {
  far: [20, 12],
  middle: [34, 24, 14],
  near: [48, 34, 20],
};
