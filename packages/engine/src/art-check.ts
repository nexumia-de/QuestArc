import type { Problem } from './content-check';

/**
 * The picture checker (docs/decisions/shared-pictures.md): the rules for
 * the built-in pictures in content/art/. A picture is a symbolic SVG
 * without colours of its own; each host fills the six roles in
 * `ART_ROLES` from its theme. Only a small whitelist of elements
 * and attributes passes, so colours, styles, scripts, links, images, text
 * and fonts cannot get in. The checker reads the file as text with its own
 * small XML reader, so it runs anywhere the engine runs.
 */

/** Largest file in bytes; a picture is a handful of shapes. */
export const ART_MAX_BYTES = 4096;

/**
 * The view boxes: a region's ground (`ground-…`), a ladder's setting
 * (`setting-…`), a version of a build (`build-…`, larger than an icon so a
 * bridge or a house reads as the subject of a screen) and every other
 * picture.
 */
export const ART_VIEW_BOX = {
  ground: '0 0 320 120',
  setting: '0 0 320 180',
  build: '0 0 120 80',
  picture: '0 0 32 32',
} as const;

/** The view box a picture's name asks for. */
export const artViewBox = (name: string): string => {
  const [kind] = name.split('-');
  return kind === 'ground' || kind === 'setting' || kind === 'build'
    ? ART_VIEW_BOX[kind]
    : ART_VIEW_BOX.picture;
};

/**
 * The colour roles. `fg` text colour (outlines), `accent` the host's
 * accent, `dim` text mixed into the surface, `bg` the surface itself (the
 * fill inside outlines), `tint` and `tint-strong` the accent mixed into
 * the surface at a low and a stronger fixed share (ground and distance).
 * Each host computes every role as an opaque colour.
 */
export const ART_ROLES = ['fg', 'accent', 'dim', 'bg', 'tint', 'tint-strong'] as const;

const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const NUMBER = /^-?(\d+(\.\d*)?|\.\d+)$/;
const PATH_DATA = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s+-]+$/;
const POINTS = /^[0-9.,\s-]+$/;
const TITLE_MAX = 80;

type Check = (value: string) => boolean;
const number: Check = (v) => NUMBER.test(v);
const shape = { class: (v: string) => (ART_ROLES as readonly string[]).includes(v) };

/** Allowed elements below the root and their allowed attributes. */
const SHAPES: Record<string, Record<string, Check>> = {
  path: {
    ...shape,
    d: (v) => PATH_DATA.test(v),
    'fill-rule': (v) => v === 'evenodd' || v === 'nonzero',
  },
  circle: { ...shape, cx: number, cy: number, r: number },
  ellipse: { ...shape, cx: number, cy: number, rx: number, ry: number },
  rect: { ...shape, x: number, y: number, width: number, height: number, rx: number, ry: number },
  polygon: { ...shape, points: (v) => POINTS.test(v) },
};

interface Element {
  readonly name: string;
  readonly attributes: Record<string, string>;
  readonly children: Element[];
  text: string;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** The file as a tree, or a message why it is not the XML subset pictures use. */
const parse = (source: string): Element | string => {
  const stack: Element[] = [];
  let root: Element | undefined;
  let at = 0;
  const unescape = (text: string): string | undefined => {
    let bad = false;
    const out = text.replace(/&([a-z]+);|&/g, (all, name?: string) => {
      const value = name === undefined ? undefined : ENTITIES[name];
      if (value === undefined) bad = true;
      return value ?? all;
    });
    return bad ? undefined : out;
  };
  while (at < source.length) {
    const open = source.indexOf('<', at);
    const text = source.slice(at, open === -1 ? source.length : open);
    if (text.trim() !== '') {
      const parent = stack.at(-1);
      if (parent === undefined) return 'text outside the svg element';
      const plain = unescape(text);
      if (plain === undefined)
        return 'unknown entity; only &amp; &lt; &gt; &quot; &apos; are allowed';
      parent.text += plain;
    }
    if (open === -1) break;
    if (source.startsWith('<!--', open)) {
      const end = source.indexOf('-->', open + 4);
      if (end === -1) return 'unclosed comment';
      at = end + 3;
      continue;
    }
    if (source.startsWith('<!', open) || source.startsWith('<?', open))
      return 'no declarations, DOCTYPE, CDATA or processing instructions';
    const close = source.indexOf('>', open);
    if (close === -1) return 'unclosed tag';
    const tag = source.slice(open + 1, close);
    at = close + 1;
    if (tag.startsWith('/')) {
      const name = tag.slice(1).trim();
      const top = stack.pop();
      if (top?.name !== name) return `</${name}> does not close <${top?.name ?? ''}>`;
      continue;
    }
    const selfClosing = tag.endsWith('/');
    const body = selfClosing ? tag.slice(0, -1) : tag;
    const match = /^([A-Za-z][\w:.-]*)([\s\S]*)$/.exec(body);
    if (match === null) return `bad tag <${tag}>`;
    const [, name = '', rest = ''] = match;
    const attributes: Record<string, string> = {};
    const attribute = /\s+([A-Za-z_][\w:.-]*)\s*=\s*("([^"<]*)"|'([^'<]*)')/gy;
    let used = 0;
    for (let a = attribute.exec(rest); a !== null; a = attribute.exec(rest)) {
      const key = a[1] ?? '';
      if (key in attributes) return `<${name}> repeats ${key}`;
      const value = unescape(a[3] ?? a[4] ?? '');
      if (value === undefined) return `<${name} ${key}> has an unknown entity`;
      attributes[key] = value;
      used = attribute.lastIndex;
    }
    if (rest.slice(used).trim() !== '') return `bad attributes in <${name}>`;
    const element: Element = { name, attributes, children: [], text: '' };
    const parent = stack.at(-1);
    if (parent === undefined) {
      if (root !== undefined) return 'more than one root element';
      root = element;
    } else parent.children.push(element);
    if (!selfClosing) stack.push(element);
  }
  if (stack.length > 0) return `<${stack.at(-1)?.name ?? ''}> is not closed`;
  return root ?? 'no svg element';
};

/**
 * Problems of one picture file: `name` is the file name without `.svg`,
 * `source` its text. Every problem is an error; a picture either follows
 * the rules or is not shipped.
 */
export const artProblems = (name: string, source: string): Problem[] => {
  const problems: Problem[] = [];
  const error = (at: string, message: string) => problems.push({ level: 'error', at, message });
  if (!NAME.test(name)) error('name', 'use lower-case words joined by hyphens');
  const bytes = new TextEncoder().encode(source).length;
  if (bytes > ART_MAX_BYTES) error('file', `${bytes} bytes; at most ${ART_MAX_BYTES}`);

  const root = parse(source);
  if (typeof root === 'string') {
    error('file', root);
    return problems;
  }
  if (root.name !== 'svg') error('svg', `the root is <${root.name}>, not <svg>`);
  const viewBox = artViewBox(name);
  for (const [key, value] of Object.entries(root.attributes)) {
    if (key === 'xmlns') {
      if (value !== 'http://www.w3.org/2000/svg') error('svg', 'xmlns must be the SVG namespace');
    } else if (key === 'viewBox') {
      if (value !== viewBox) error('svg', `viewBox must be "${viewBox}"`);
    } else error('svg', `attribute ${key} is not allowed`);
  }
  if (root.attributes.xmlns === undefined) error('svg', 'xmlns is missing');
  if (root.attributes.viewBox === undefined) error('svg', `viewBox "${viewBox}" is missing`);
  if (root.text.trim() !== '') error('svg', 'text is only allowed in <title>');

  const [title, ...shapes] = root.children;
  const words = title?.name === 'title' ? title.text.trim() : '';
  if (title?.name !== 'title' || words === '')
    error('title', 'the first element is a <title> that names the picture in words');
  else {
    if (words.length > TITLE_MAX)
      error('title', `${words.length} characters; at most ${TITLE_MAX}`);
    if (Object.keys(title.attributes).length > 0 || title.children.length > 0)
      error('title', '<title> has only text');
  }
  if (shapes.length === 0) error('svg', 'no shapes');

  shapes.forEach((element, index) => {
    const at = `${element.name}[${index}]`;
    const allowed = SHAPES[element.name];
    if (allowed === undefined) {
      error(at, `<${element.name}> is not allowed; use path, circle, ellipse, rect or polygon`);
      return;
    }
    if (element.children.length > 0 || element.text.trim() !== '') error(at, 'shapes are empty');
    for (const [key, value] of Object.entries(element.attributes)) {
      const check = allowed[key];
      if (check === undefined)
        error(at, `attribute ${key} is not allowed (no colours, styles, links or ids)`);
      else if (!check(value))
        error(
          at,
          key === 'class' ? `class must be one of ${ART_ROLES.join(', ')}` : `bad value of ${key}`,
        );
    }
    if (element.attributes.class === undefined)
      error(at, `class is missing; one of ${ART_ROLES.join(', ')}`);
  });
  return problems;
};
