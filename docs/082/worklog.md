# Worklog: Story Manager Documentation

## 1. Context
The project goal shifted to a "Story Manager" model where users create Stories as Projects using a Template system (Paper Icon), rather than editing JSON files. This required a rewrite of the documentation to guide users on this new creation process.

## 2. Changes

### Documentation Updates
-   **`docs/SYNTAX_GUIDE.md`**:
    -   Renamed to "QuestArc Story & Syntax Guide".
    -   Added "Story Templates" section explaining the Project/Template/Task structure.
    -   Updated syntax examples to be contextualized within this new system (Habits, Grinds, Bosses as tags in titles).
    -   Explicitly stated *not* to use JSON configs.

-   **`docs/DATA_MODELS.md`**:
    -   Added a disclaimer that models are the "Internal Game State" derived from User Projects.
    -   Clarified that `HeroStory` is parsed from the Project Template.

## 3. Verification
-   Verified `SYNTAX_GUIDE.md` clearly explains the "Project as Story" concept.
-   Verified `DATA_MODELS.md` maintains type accuracy while clarifying the data source.
