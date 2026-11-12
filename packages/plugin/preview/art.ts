// The picture spike's page (#86): the test scene and every single picture
// from content/art/, drawn by src/ui/art.ts with the theme variables of
// preview/theme.ts. Query: ?theme=light|dark. Built by preview.mjs into
// dist/preview/art.html; not part of the plugin.
import { pictures, scenes } from 'virtual:questarc-art';
import { picture, scene } from '../src/ui/art';
import { themeCss } from './theme';

const theme = new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light';
const style = document.createElement('style');
style.textContent = `${themeCss(theme)}
body{background:var(--bg);color:var(--text-color);font-family:var(--font-primary-stack);font-size:14px;margin:0}
main{max-width:720px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:16px}
h1{font-size:18px;margin:0}
.card{background:var(--bg-lighter);border-radius:12px;box-shadow:var(--card-shadow);padding:12px}
.card p{margin:8px 0 0;color:var(--text-color-muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.cell{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;font-size:12px}
.cell svg{width:48px;height:48px}
.small{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.small svg{width:24px;height:24px}`;
document.head.append(style);

const el = (tag: string, className: string, ...children: (Node | string)[]) => {
  const node = document.createElement(tag);
  node.className = className;
  node.append(...children);
  return node;
};

const main = el('main', '', el('h1', '', 'Pictures from content/art'));
for (const layout of Object.values(scenes)) {
  main.append(el('div', 'card', scene(layout, pictures), el('p', '', layout.title)));
}
const names = Object.keys(pictures).filter((name) => !name.startsWith('ground-'));
main.append(
  el(
    'div',
    'card grid',
    ...names.map((name) => {
      const source = pictures[name] ?? '';
      return el('div', 'cell', picture(source), name);
    }),
  ),
  el('div', 'card small', ...names.map((name) => picture(pictures[name] ?? ''))),
);
document.body.append(main);
