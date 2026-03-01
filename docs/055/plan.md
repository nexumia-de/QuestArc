# 055 - Improve Documentation Consistency

## Goal

Update project documentation to reflect recent refactoring standards and new component additions, ensuring the "docs as source of truth" principle is maintained.

## User Review Required

None. These are documentation updates based on previously approved code changes.

## Proposed Changes

### UI Guidelines

#### [MODIFY] [UI_GUIDELINES.md](file:///home/deck/Projects/QuestArc/docs/UI_GUIDELINES.md)

- Add "Modals & Dialogs" section.
- Document `ConfirmDialog` usage.
- Clarify "When to use Modals".

### Contribution Guidelines

#### [MODIFY] [CONTRIBUTING.md](file:///home/deck/Projects/QuestArc/docs/CONTRIBUTING.md)

- Add "Coding Standards" section (expanding on Code Style).
- Mandate `const Component: Component<Props>` syntax.
- Mandate Import Order (External -> Types -> Services -> Components -> Styles).
- Mention `section` over `div` for top-level view containers.

## Verification Plan

### Manual Verification

- Review rendered markdown to ensure formatting is correct.
- Verify consistency between strict rules in `CONTRIBUTING.md` and actual code.
