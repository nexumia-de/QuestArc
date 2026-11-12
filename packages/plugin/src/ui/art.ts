/**
 * Pictures from content/art/ as inline SVG (docs/decisions/shared-pictures.md).
 * A picture has no colours of its own: its shapes carry the roles `fg`,
 * `accent` and `dim`, which style.css (`.qa-art`) fills from Super
 * Productivity's theme variables, so light and dark follow the app. The
 * files are checked in CI (no scripts, links or styles), and only the
 * built-in set is ever drawn.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface Scene {
  /** The scene in words, for screen readers. */
  readonly title: string;
  readonly width: number;
  readonly height: number;
  readonly pictures: readonly {
    readonly art: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }[];
}

const parse = (source: string): SVGSVGElement => {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  return document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
};

/** One picture, named in words by its title. */
export const picture = (source: string): SVGSVGElement => {
  const svg = parse(source);
  const title = svg.querySelector('title');
  svg.classList.add('qa-art');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', title?.textContent?.trim() ?? '');
  title?.remove();
  return svg;
};

/** A scene: pictures at fixed places in one view box, named by the scene's title. */
export const scene = (layout: Scene, sources: Readonly<Record<string, string>>): SVGSVGElement => {
  const svg = document.createElementNS(SVG_NS, 'svg');
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
    svg.append(part);
  }
  return svg;
};
