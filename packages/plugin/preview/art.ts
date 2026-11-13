// The pictures' page (#86, #42): every single picture at 48, 32 and
// 24 px, and the ladders (preview/ladders.ts), drawn by src/ui/art.ts with
// the theme variables of preview/theme.ts. Query: ?theme=light|dark&
// part=sizes|sequence-<ladder>|journey-<ladder>|palette[&hue=<palette name>]. Built
// by preview.mjs into dist/preview/art.html; not part of the plugin.
import { pictures } from 'virtual:questarc-art';
import { picture } from '../src/ui/art';
import { hues, journey, laddersCss, sequence } from './ladders';
import { themeCss } from './theme';

const query = new URLSearchParams(location.search);
const theme = query.get('theme') === 'dark' ? 'dark' : 'light';
const part = query.get('part') ?? 'sizes';
const style = document.createElement('style');
style.textContent = `${themeCss(theme)}
body{background:var(--bg);color:var(--text-color);font-family:var(--font-primary-stack);font-size:14px;margin:0}
main{max-width:720px;margin:0 auto;padding:12px 16px;display:flex;flex-direction:column;gap:12px}
h1{font-size:18px;margin:4px 0 0}
.card{background:var(--bg-lighter);border-radius:12px;box-shadow:var(--card-shadow);overflow:hidden}
.sizes{display:grid;grid-template-columns:repeat(auto-fill,minmax(136px,1fr));gap:4px 8px;padding:8px 12px}
.cell{display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--text-color-muted)}
.row{display:flex;align-items:flex-end;gap:8px}
.s48{width:48px;height:48px}.s32{width:32px;height:32px}.s24{width:24px;height:24px}
${laddersCss}`;
document.head.append(style);

const el = (tag: string, className: string, ...children: (Node | string)[]) => {
  const node = document.createElement(tag);
  node.className = className;
  node.append(...children);
  return node;
};
const sized = (source: string, size: number) => {
  const svg = picture(source);
  svg.classList.add(`s${size}`);
  return svg;
};

const main = el('main', '');
const hue = query.get('hue');
if (part.startsWith('sequence-')) {
  main.style.maxWidth = '1400px';
  main.append(...sequence(el, part.slice('sequence-'.length), hue));
} else if (part.startsWith('journey-')) {
  main.classList.add('mock');
  main.append(...journey(el, part.slice('journey-'.length), hue));
} else if (part === 'palette') {
  main.style.maxWidth = '1400px';
  main.append(...hues(el));
} else {
  const names = Object.keys(pictures).filter((name) => !name.includes('-cord-'));
  main.append(
    el('h1', '', 'Every picture at 48, 32 and 24 px'),
    el(
      'div',
      'card sizes',
      ...names.map((name) => {
        const source = pictures[name] ?? '';
        return el(
          'div',
          'cell',
          el('div', 'row', ...[48, 32, 24].map((size) => sized(source, size))),
          name,
        );
      }),
    ),
  );
}
document.body.append(main);
