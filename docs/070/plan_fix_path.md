# Bug Fix: Relative Asset Paths

## Problem
After disabling asset inlining, `index.html` references scripts and styles using absolute paths:
```html
<script type="module" crossorigin src="/index.js"></script>
```
This fails when the plugin is loaded in a non-root context (e.g. `file://` or blob URI), causing:
`‘src’ attribute of <script> element is not a valid URI: “/index.js”`

## Goal
Ensure generated HTML uses relative paths for assets.

## Proposed Changes

### [MODIFY] [vite.config.ts](file:///home/deck/Projects/QuestArc/vite.config.ts)
Set `base` to `./` to ensure relative paths.

```typescript
export default defineConfig({
  base: './', // Add this
  plugins: [ ... ],
  // ...
});
```

## Verification
1.  Run `npm run build`.
2.  Check `dist/index.html`. It should have `src="./index.js"` or `src="index.js"`.
