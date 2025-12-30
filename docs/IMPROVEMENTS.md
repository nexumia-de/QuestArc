# Improvement Backlog

## MVP 1: The Core Engine
- [ ] **001**: **The Foundation.** Define `QuestArcState`, `HeroStory`, and `HeroProfile` interfaces in `src/types/`. Set up the `plugin.ts` to load/save empty state.
- [ ] **002**: **The Brain (Logic).** Implement `StoryEngine` class in `plugin.ts`. Handle `TASK_DONE` to calculate streak increments and simple Boss Damage.
- [ ] **003**: **The Signal (Mobile Header).** Implement `plugin.registerHeaderListItem` in `plugin.ts` to visualize Boss HP/Story Step.
- [ ] **004**: **The Face (UI).** Create the Basic SolidJS Dashboard to display the current story text and `xp` from the state.