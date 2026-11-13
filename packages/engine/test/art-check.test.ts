import { describe, expect, it } from 'vitest';
import { ART_MAX_BYTES, ART_ROLES, artProblems } from '../src/art-check';

// The picture checker on a picture that passes, and on one broken copy per
// rule (docs/decisions/shared-pictures.md).
const good = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <title>Stone &amp; moss</title>
  <!-- a comment is fine -->
  <path class="fg" fill-rule="evenodd" d="M4 30C4 20 28 20 28 30Z"/>
  <circle class="accent" cx="16" cy="12" r="3"/>
  <rect class="dim" x="2" y="29" width="28" height="1" rx="0.5"/>
</svg>`;

const messages = (name: string, source: string) =>
  artProblems(name, source).map((p) => `${p.at}: ${p.message}`);

describe('artProblems', () => {
  it('passes a symbolic picture', () => {
    expect(artProblems('stone', good)).toEqual([]);
  });

  it.each(ART_ROLES)('passes the role %s', (role) => {
    expect(artProblems('stone', good.replace('class="fg"', `class="${role}"`))).toEqual([]);
  });

  it('knows the six roles', () => {
    expect(ART_ROLES).toEqual(['fg', 'accent', 'dim', 'bg', 'tint', 'tint-strong']);
  });

  it.each([
    ['a fill colour', good.replace('class="accent"', 'class="accent" fill="#ff0000"'), /fill/],
    ['a stroke', good.replace('class="dim"', 'class="dim" stroke="red"'), /stroke/],
    ['a style attribute', good.replace('class="fg"', 'class="fg" style="fill:red"'), /style/],
    [
      'a style element',
      good.replace('</title>', '</title><style>.fg{fill:red}</style>'),
      /<style>/,
    ],
    ['a script', good.replace('</svg>', '<script>alert(1)</script></svg>'), /<script>/],
    ['an event handler', good.replace('<svg ', '<svg onload="alert(1)" '), /onload/],
    ['a link', good.replace('</svg>', '<a href="https://example.org"></a></svg>'), /<a>/],
    ['an image', good.replace('</svg>', '<image href="x.png"/></svg>'), /<image>/],
    ['text', good.replace('</svg>', '<text>Hi</text></svg>'), /<text>/],
    ['a use reference', good.replace('</svg>', '<use href="#a"/></svg>'), /<use>/],
    ['an id', good.replace('class="fg"', 'class="fg" id="a"'), /id/],
    ['another class', good.replace('class="fg"', 'class="red"'), /class must be/],
    ['an unknown role', good.replace('class="fg"', 'class="tint-weak"'), /class must be/],
    ['two roles', good.replace('class="fg"', 'class="fg tint"'), /class must be/],
    ['a shape without a role', good.replace('class="accent" ', ''), /class is missing/],
    [
      'a group',
      good.replace('<circle', '<g class="fg"><circle').replace('r="3"/>', 'r="3"/></g>'),
      /<g>/,
    ],
    ['another view box', good.replace('0 0 32 32', '0 0 24 24'), /viewBox/],
    ['no title', good.replace(/<title>.*<\/title>/, ''), /title/],
    ['a DOCTYPE', `<!DOCTYPE svg [<!ENTITY a "b">]>${good}`, /DOCTYPE/],
    ['an unknown entity', good.replace('&amp;', '&nbsp;'), /entity/],
    ['an unclosed element', good.replace('</svg>', ''), /not closed/],
    ['a bad path', good.replace('M4 30', 'url(#x) M4 30'), /bad value of d/],
  ])('fails with %s', (_name, source, pattern) => {
    expect(messages('stone', source).join('\n')).toMatch(pattern);
  });

  it('fails a file over the size limit', () => {
    const big = good.replace(
      '</svg>',
      `${'<circle class="fg" cx="1" cy="1" r="1"/>'.repeat(120)}</svg>`,
    );
    expect(big.length).toBeGreaterThan(ART_MAX_BYTES);
    expect(messages('stone', big).join('\n')).toMatch(/bytes/);
  });

  it('wants the view box of a setting and of a build', () => {
    expect(messages('setting-river', good).join('\n')).toMatch(/0 0 320 180/);
    expect(messages('build-crossing-1', good).join('\n')).toMatch(/0 0 120 80/);
    expect(messages('build-crossing-1', good.replace('0 0 32 32', '0 0 120 80'))).toEqual([]);
  });

  it('wants a lower-case name', () => {
    expect(messages('Stone_1', good).join('\n')).toMatch(/name/);
  });
});
