/**
 * A small helper to build DOM elements, so screens read like markup
 * (decision: docs/decisions/plugin-ui-without-framework.md).
 */

type Child = Node | string | number | false | null | undefined;
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set([
  'svg',
  'path',
  'circle',
  'line',
  'polyline',
  'polygon',
  'rect',
  'g',
  'text',
  'title',
]);

export const h = (
  tag: string,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElement | SVGElement => {
  const el = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (typeof value === 'function')
      el.addEventListener(name.replace(/^on/, '').toLowerCase(), value);
    else el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) {
    if (child === false || child === null || child === undefined) continue;
    el.append(typeof child === 'object' ? child : String(child));
  }
  return el;
};

/** A drawn icon from a single SVG path (24 × 24), hidden from screen readers. */
export const icon = (path: string): SVGElement =>
  h(
    'svg',
    { viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true', class: 'qa-icon' },
    h('path', { d: path }),
  ) as SVGElement;

export const ICONS = {
  back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z',
  menu: 'M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  settings:
    'M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.3 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
} as const;
