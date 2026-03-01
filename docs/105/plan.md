# Fix Deploy Pipeline Versioning

This change ensures that the deployed plugin uses the Git tag as its version number, both in the filename and within the plugin's metadata.

## User Review Required

> [!NOTE]
> This change modifies the build script and CI pipeline.

## Proposed Changes

### Build Scripts

#### [MODIFY] [build-plugin.js](file:///home/deck/Projects/QuestArc/scripts/build-plugin.js)

- Modify `packagePlugin` function to:
  - Check for `PLUGIN_VERSION` environment variable.
  - If present:
    - Use it as the version in `manifest.json` (write to `dist/manifest.json` before zipping).
    - Append it to the output filename (e.g., `quest-arc-v1.0.2.zip`).
  - If not present, fallback to `package.json` version or `src/manifest.json` version.

### CI Configuration

#### [MODIFY] [.woodpecker.yml](file:///home/deck/Projects/QuestArc/.woodpecker.yml)

- Update the `build` step to pass `PLUGIN_VERSION` environment variable using `CI_COMMIT_TAG`.
- Update the `build` step to list the zip file explicitly if name changes.
- Update the `publish` step to select the correct files based on the new pattern.

## Verification Plan

### Automated Tests

- Run `PLUGIN_VERSION=v2.0.0 npm run package` locally and verify:
  - `dist/manifest.json` contains `"version": "v2.0.0"` (or `2.0.0` if we strip v).
  - Output zip file is named `quest-arc-v2.0.0.zip`.
  - Zip file contains `manifest.json` with correct version.

### Manual Verification

- N/A (CI verification is the main one).
