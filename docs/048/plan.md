# Plan: Story Visual Overhaul & Progressive Disclosure

## 1. Goal
Increase immersion by visually separating story text from tasks and enhancing boss encounters. Implement progressive disclosure for narrative text.

## 2. Proposed Changes
### Data Models
- Update `StoryStep` interface:
    - `flavor_text`: string (optional)
    - `display_mode`: 'visible' | 'collapsed' | 'tooltip' (optional, default 'visible')
    - `environment_theme`: string (optional, e.g., 'forest', 'dungeon')

### UI Components
- **StoryCard / Step Rendering**:
    - Add logic to render `flavor_text`.
    - Implement styling: Italic, left-border accent.
    - Implement mechanics: `<details>` / `<summary>` for 'collapsed', valid `tooltip` logic.
- **Boss Encounter**:
    - Add "shake" animation class.
    - Add dynamic background styles.
    - Add Boss Icon (SVG).
- **Progress Indicator**:
    - Add breadcrumb/dots "Step X/Y".

### Editor
- Add inputs for the new fields in `StoryStepEditor`.

## 3. Verification
- **Manual**: Create story with new fields, verify visual output. Test boss HP reduction for shake effect.
