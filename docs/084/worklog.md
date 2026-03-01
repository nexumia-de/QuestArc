# Worklog: Documentation Correction (Icon vs Title)

## 1. Context

The user identified an error in the documentation regarding how Story Templates are marked. The previous docs stated to "Set the Project Icon to Scroll (📜)", but the code (`src/services/scanner.service.ts`) actually checks for the **Title prefix** `📜` and potentially the **Project Icon** `🏹`.

## 2. Changes

### Documentation Updates

- **`README.md`**: Corrected "Quick Start" and "How It Works" to explicitly state:
  - Set Project Icon to `🏹`.
  - Start Project Title with `📜`.
- **`docs/SYNTAX_GUIDE.md`**: Updated "Creating a Template" section with the same logic.
- **`docs/DATA_MODELS.md`**: Clarified that `HeroStory` is parsed from Projects where the Title starts with `📜`.

## 3. Verification

- Verified against `src/services/scanner.service.ts` (lines 94-98) which uses `title.startsWith('📜')` for template classification.
