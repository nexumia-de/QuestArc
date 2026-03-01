# Plan: Super Productivity Theme Alignment

## Goal

Eliminate the "alien" feel of the plugin by adopting the host application's design language. The current design is too blue/round compared to the host's flat/grey/angular Material design.

## Proposed Changes

### 1. Color Palette Overhaul (De-Blue)

Replace the Tailwind "Slate" palette with a neutral "Material Grey" palette observed in the screenshots.

| Variable         | Current (Blue-ish)     | Target (Neutral/Material)                                        |
| :--------------- | :--------------------- | :--------------------------------------------------------------- |
| `dark --bg`      | `#0f172a` (Blue Dark)  | `#121212` (Material Background)                                  |
| `dark --card-bg` | `#1e293b` (Blue Grey)  | `#1e1e1e` (Surface)                                              |
| `dark --border`  | `#475569` (Blue Slate) | `#333333` (Subtle Grey)                                          |
| `dark --text`    | `#ffffff`              | `#e0e0e0` (Material Text)                                        |
| `--primary`      | `#6366f1` (Indigo)     | `#3f51b5` (Standard Material Blue - matches "Finish Day" button) |

### 2. Geometry & Shape

- **Radius**: Reduce global border-radius from `16px` to `4px` (matching the "Finish Day" button and list items).
- **Shadows**: Reduce shadow spread; Super Productivity is quite flat.

### 3. Component Updates

- **Header**: Remove the card background entirely? Or make it blend more.
- **Buttons**: Un-pill the "Active Badge". Square off buttons.
- **Reset Button**: It's too prominent. Make it an outline button or text link to match "secondary" actions in the host.

## Files to Modify

- `src/app/App.css`: Complete variable and shape overhaul.

## Verification

- Visual check against the provided screenshot.
