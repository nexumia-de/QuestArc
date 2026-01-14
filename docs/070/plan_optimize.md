# Bug Fix: Asset Inlining & Size Optimization

## Problem
Single-file `index.html` is 105KB. Limit is 100KB.
We need to remove ~6KB.
CSS is 32KB.

## Optimization Strategy

### 1. Optimize `src/app/App.css`
- Remove unused keyframes or large comments (if any).
- Check for embedded fonts/images.
- Manually minify if needed (though Vite does this).

### 2. Remove Unused Code in `plugin.ts` / TS
- Ensure no large mock data strings are included in production.

### 3. Last Resort: HTML Minification
- `vite-plugin-minification`?
- Config `vite` to enable `html-minifier` options?
- The built-in html minifier is usually good.

## Action Plan
1.  Analyze `App.css`.
2.  Remove any unused styles.
3.  Rebuild.
