/**
 * Pictures from content/art/ as inline SVG (docs/decisions/shared-pictures.md).
 * A picture has no colours of its own: its shapes carry the roles `fg`,
 * `accent`, `dim`, `bg`, `tint` and `tint-strong`, which style.css
 * (`.qa-art`) fills from Super Productivity's theme variables, so light
 * and dark follow the app; a scene's far band is one silhouette in
 * `tint` (class `qa-art-far`). A region may take `accent`, `tint` and
 * `tint-strong` from a hue of the palette instead of the app. The
 * files are checked in CI (no scripts, links or styles), and only the
 * built-in set is ever drawn.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A hue of the region palette (content/art/palette.json, #42). */
export interface Hue {
  readonly title: string;
  readonly light: string;
  readonly dark: string;
}

export interface Placed {
  readonly art: string;
  /** The depth band; missing for the ground (docs/journey-design.md). */
  readonly band?: 'far' | 'middle' | 'near';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** A class for the part, e.g. to let it appear (wrapped in a group). */
  readonly className?: string;
}

export interface Scene {
  /** The scene in words, for screen readers. */
  readonly title: string;
  readonly width: number;
  readonly height: number;
  readonly pictures: readonly Placed[];
}

const parse = (source: string): SVGSVGElement => {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  return document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
};

/**
 * A region's hue: `accent`, `tint` and `tint-strong` from the palette
 * (style.css, `.qa-art-hue`), the light or dark value as the theme is.
 */
const tinted = (svg: SVGSVGElement, hue: Hue | undefined): SVGSVGElement => {
  if (hue === undefined) return svg;
  svg.classList.add('qa-art-hue');
  svg.style.setProperty('--qa-hue-light', hue.light);
  svg.style.setProperty('--qa-hue-dark', hue.dark);
  return svg;
};

/** One picture, named in words by its title; in a region's hue if given. */
export const picture = (source: string, hue?: Hue): SVGSVGElement => {
  const svg = tinted(parse(source), hue);
  const title = svg.querySelector('title');
  svg.classList.add('qa-art');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', title?.textContent?.trim() ?? '');
  title?.remove();
  return svg;
};

/** A scene: pictures at fixed places in one view box, named by the scene's title. */
export const scene = (
  layout: Scene,
  sources: Readonly<Record<string, string>>,
  hue?: Hue,
): SVGSVGElement => {
  const svg = tinted(document.createElementNS(SVG_NS, 'svg'), hue);
  svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
  svg.classList.add('qa-art');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', layout.title);
  for (const place of layout.pictures) {
    const source = sources[place.art];
    if (source === undefined) continue;
    const part = parse(source);
    part.querySelector('title')?.remove();
    for (const key of ['x', 'y', 'width', 'height'] as const)
      part.setAttribute(key, String(place[key]));
    if (place.band === 'far') part.classList.add('qa-art-far');
    if (place.className === undefined) svg.append(part);
    else {
      // a nested svg takes no CSS transform; its group does
      const group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('class', place.className);
      group.append(part);
      svg.append(group);
    }
  }
  return svg;
};
