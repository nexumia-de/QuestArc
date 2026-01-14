# Bug Fix: Vite Plugin Inlining Syntax Error

## Problem
The `quest-arc` plugin build fails with `SyntaxError: Unexpected identifier 'as'` when running in the host.
This is caused by the custom `inlineJsChunks` logic in `@super-productivity/vite-plugin`.
The regex `(\w+)\s+as\s+(\w+)` used to parse `export { ... }` statements fails to match identifiers containing characters like `$`, which are valid in JS (e.g., `$` as an alias).
This results in invalid code generation: `$ as f: $ as f`.

## Goal
Fix the regex in `packages/vite-plugin/src/index.ts` to correctly handle all valid JS identifiers, or at least `$` which is commonly used in minified code.

## Proposed Changes

### [MODIFY] [packages/vite-plugin/src/index.ts](file:///home/deck/Projects/QuestArc/packages/vite-plugin/src/index.ts)
Update the regex to capture `$` and other identifier characters.
Replace:
```typescript
const asMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
```
With:
```typescript
const asMatch = trimmed.match(/([a-zA-Z0-9_$]+)\s+as\s+([a-zA-Z0-9_$]+)/);
```

## Build Steps
1.  **Build Vite Plugin**: Run `npm run build` in `packages/vite-plugin`.
2.  **Build QuestArc**: Run `npm run build` in root.

## Verification
1.  Check `dist/plugin.js`.
2.  Run `node -c dist/plugin.js` to verify syntax.
