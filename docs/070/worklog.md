# Worklog: Plugin Manifest Size Optimization

## Issue
The plugin failed to load with `Error: Plugin manifest is too large (max 100.0KB)`.
Investigation showed that `dist/index.html` was 106KB because the build process was inlining `index.js` (68KB) and `index.css` (32KB) directly into the HTML file.

## Solution
Disabled asset inlining in `vite.config.ts`.
This keeps the assets separate in the ZIP file, reducing `index.html` to ~1KB.

### Changes
*   **Modified `vite.config.ts`**:
    ```typescript
    plugins: [solidPlugin(), superProductivityPlugin({ inlineAssets: false })],
    ```

## Verification
Ran `npm run build`.
*   `dist/index.html`: **965 B** (Previously 106 KB)
*   `dist/index.js`: **68 KB**
*   `dist/index.css`: **32 KB**
*   `dist/plugin.js`: **22 KB**

The plugin package structure is now valid and within size limits for the manifest entry points.

## Follow-up: Syntax Error Fix
After fixing the size issue, a `SyntaxError: missing : after property id` was encountered.
This was due to the regex in `@super-productivity/vite-plugin` not correctly handling `$` characters in minified export identifiers (e.g., `export { $ as f }`).

### Fix
Updated `packages/vite-plugin/src/index.ts` regex:
```typescript
// Old
/(\w+)\s+as\s+(\w+)/
// New
/([a-zA-Z0-9_$]+)\s+as\s+([a-zA-Z0-9_$]+)/
```
Rebuilt both the vite-plugin and QuestArc. Syntax analysis of `dist/plugin.js` passed.

## Follow-up: Asset Loading Fix
After disabling inlining, the plugin failed to load assets because they were referenced with absolute paths (e.g., `/index.js`), which failed in the plugin sandbox.
Setting `base: './'` in `vite.config.ts` caused paths to be generated as `../index.js` because Vite output them to `dist/src/` before the plugin moved them to `dist/`.

### Fix
1.  Set `base: './'` in `vite.config.ts`.
2.  Updated `@super-productivity/vite-plugin` to rewrite `../` to `./` when moving `index.html` from `dist/src/` to `dist/`.

Verified `dist/index.html` now contains `src="./index.js"` and loads correctly.

## Follow-up: Manifest Size & Inlining (Optimization)
The URI error persisted with relative paths in some contexts, so we reverted to `inlineAssets: true`.
However, this pushed the size to ~106KB (limit 100KB).

### Optimizations Applied
1.  **Build Config**:
    *   Set `minify: 'terser'` with aggressive options (`toplevel`, `unsafe`, `passes: 2`).
    *   Set `target: 'esnext'` to reduce polyfills.
    *   Removed unused `@solidjs/router`.
2.  **Code Cleanup**:
    *   Refactored `QuestDashboard.tsx` to remove ~2KB of unused Tailwind class strings.
    *   Removed unused "Pet" styles (~1.2KB) from `App.css`.
    *   Removed unused CSS variables (`--xp-gradient`, `--hp-gradient`).
3.  **Content Trimming**:
    *   Trimmed flavor text in `getting-started.json` to save ~400 bytes.

### Result
Final `dist/index.html` size: **102,365 bytes** (< 102,400 bytes).
The plugin is now a valid single-file bundle.
