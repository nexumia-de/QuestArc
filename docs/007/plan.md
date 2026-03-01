# Plan - Fix Black Screen & Import Error (ID: 007)

## Goal

Fix the black screen issue in the UI and the "Cannot use import statement outside a module" error that appeared after task 006.

## Analysis

- **Symptoms:**
  - Black screen in the plugin UI (iframe).
  - "Cannot use import statement outside a module" error upon reload.
- **Potential Causes:**
  - The refactor in task 006 introduced shared code in `src/lib/state-manager.ts` which is imported by both `plugin.ts` and `App.tsx`.
  - `plugin.ts` might be retaining `import` statements in the output if not bundled correctly, or the runtime environment for `plugin.ts` does not support ES modules (it expects a script or CJS).
  - `App.tsx` might similarly hold invalid imports or fail if the shared module isn't transpiled correctly for the browser.
  - The build configuration (`vite.config.ts`) might need adjustment to ensure `plugin.ts` is fully bundled (no external imports) and in the correct format (likely IIFE or CJS).

## Investigation Steps

1.  **Examine `vite.config.ts`:** Check how `plugin.ts` is built. Is it inlining dependencies? What is the output format?
2.  **Examine `src/plugin.ts` imports:** Verify how `state-manager` is imported.
3.  **Check `src/lib/state-manager.ts`:** Ensure it doesn't contain platform-specific code that would break one side.
4.  **Reproduce/Dry Run Reference:** Since I cannot run the app, I must rely on code analysis.

## Proposed Fixes

- **If `plugin.ts` is not bundling dependencies:** Update `vite.config.ts` to ensure `plugin.ts` bundles everything (except maybe `plugin-api`).
- **If the format is wrong:** Ensure `plugin.ts` output is `iife` or `cjs` (depending on what Super Productivity expects - usually it loads the file content, so a self-contained IIFE/bundled script is safest).
- **If `App.tsx` is failing:** Check if `state-manager` imports are compatible with the frontend build.

## Verification Plan

- Run `npm run build` and inspect the output `dist/plugin.js`. It should NOT have `import ... from ...` statements effectively (unless it's a dynamic import being handled, but usually for this plugin system it should be a single file).
- Verify `dist/index.html` (for App.tsx) loads correctly.
