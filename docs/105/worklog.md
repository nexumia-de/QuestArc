# Worklog: Deploy Pipeline Fix

## Summary

Fixed the deployment pipeline to use the Git tag as the plugin version and filename.

## Changes

- **Modified `scripts/build-plugin.js`**:
  - Now accepts `PLUGIN_VERSION` environment variable.
  - Updates `dist/manifest.json` with the version (stripping 'v' prefix if present).
  - Appends the version to the output zip filename (e.g., `quest-arc-v2.0.0.zip`).
- **Modified `.woodpecker.yml`**:
  - Passes `CI_COMMIT_TAG` as `PLUGIN_VERSION` to the build script.
  - Updated artifact pattern to match the new filename format (`quest-arc*.zip`).
- **Plan Update**:
  - Initially thought `vite.config.ts` needed modification, but version handling is entirely within the packaging script (`scripts/build-plugin.js`) for the plugin manifest.

## Verification

- Ran `PLUGIN_VERSION=v2.0.0 npm run package` locally.
- Verified output file: `quest-arc-v2.0.0.zip`.
- Verified `manifest.json` inside zip contains `"version": "2.0.0"`.

## Next Steps

- Push changes and tag a release to test the full CI pipeline.
