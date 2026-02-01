# Plan: Correction of Documentation (Icon vs Title)

## Goal
Correct the documentation regarding "Story Templates".
**Previous Incorrect Statement**: "Set the Project's icon to Scroll (📜)".
**Correct Functionality**:
1.  **Project Title**: Must START with `📜`.
2.  **Project Icon**: The standard Super Productivity project icon should (ideally) be `🏹` to identify it as a QuestArc project, but the code strictl relies on the Title Emoji for classification.

## Changes

### 1. `README.md`
-   **Correction**: "Create a Project with a title starting with '📜 ' (e.g., '📜 Morning Routine')."
-   **Icon Note**: Mention that setting the Project Icon to `🏹` is good practice/required for detection?
    -   *Code Check*: `if (!hasIcon && !isQuestPattern) continue;` -> If it has `📜` title, it passes even without `🏹`.
    -   *Code Check*: `if (!hasIcon && isQuestPattern) { env.warnings.push(...) }` -> It warns if `🏹` is missing.
    -   **Conclusion**: Instruct user to SET ICON to `🏹` AND start TITLE with `📜`.

### 2. `docs/SYNTAX_GUIDE.md`
-   Refine "Creating a Template" steps:
    1.  Create Project.
    2.  Set Icon to `🏹`.
    3.  Set Title to `📜 [Your Title]`.

### 3. `docs/DATA_MODELS.md`
-   Update `HeroStory` comment: "parsed from a Project Template (Title starts with 📜)".

## Verification
-   Double check `src/services/scanner.service.ts` one last time (checking lines 94-98).
-   Manual Review of the markdown files.
