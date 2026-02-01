# Worklog - Stateless Boss HP & Custom Damage Config

Implemented a fully stateless boss damage system and custom task configuration.

## Changes

### Implementation Details
- **Stateless Boss HP**: Boss HP is now stored in the boss task's title and JSON notes. Plugin state no longer caches HP between sessions, relying entirely on the host application's task data.
- **Custom Damage Tags**:
    - `[dmg:N]`: Specify custom damage per hit.
    - `[dmgevery:N]`: Specify frequency (1=every hit, 2=every 2nd, 0=on completion).
- **Stateless Configuration**: All task settings are now serialized into the task's JSON notes upon creation or first parse, ensuring consistent behavior across reloads.
- **Bug Fix**: Resolved an issue where GRIND and HABIT task updates were lost if a dynamic sibling boss was active.

### Verification Results
- [x] **Linting**: All TS lints resolved.
- [x] **Build**: `npm run build` passes successfully.
- [x] **Verification**: Manually verified that `[dmg]` and `[dmgevery]` tags are correctly parsed and stored in JSON notes.
- [x] **Verification**: Confirmed that dealing damage updates both the boss title (e.g., `100/100 -> 88/100`) and the task's JSON state.

## Impact
- **Stateless Reliability**: The plugin is now more robust against state loss, as the "Brain" state is mirrored in the "Face" (Super Productivity Tasks).
- **Flexibility**: Users can now create powerful "Elite" tasks that deal massive damage or "Minion" tasks that require multiple completions to damage a boss.
