# Worklog: Global Documentation Cleanup

## 1. Context

The user requested a global fact check to remove outdated legacy instructions, particularly regarding JSON-based stories.

## 2. Changes

### Documentation Updates

- **`docs/STORIES.md`**: Deprecated the entire file and added a pointer to `SYNTAX_GUIDE.md`.
- **`docs/PLUGIN_DEVELOPMENT_GUIDE.md`**: Updated "Common Tasks" to remove outdated "Adding a New Story Type" (which referred to UI forms) and replaced it with references to `parsers.ts` and `scanner.service`.
- **`docs/ROADMAP.md`**: Verified active quest icons are consistent (`🏹`, `📜`, `🧭`).

## 3. Verification

- Verified `STORIES.md` no longer misleads users.
- Verified `PLUGIN_DEVELOPMENT_GUIDE.md` reflects the current codebase structure (`scanner.service.ts`).
