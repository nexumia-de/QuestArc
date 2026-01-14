# QuestArc v2.0 – Updated Roadmap

## Phase 1: Core Logic & Compilation (Completed)

*Goal: Establish the underlying data transformation logic.*

* **[x] Regex Parsers:** Implementation of `[XP:...]`, `Nx`, `@daily`, and `⚔️` detection.
* **[x] Data Models:** Definition of `QuestTaskData` and its JSON structure for `task.notes`.
* **[x] Compiler Service:** Recursive logic to clone templates, sanitize titles, and inject metadata.

## Phase 2: Management UI & Project Scanner (Current)

*Goal: Provide a functional interface to trigger and manage quests.*

* **Project Scanner:** Service to detect projects with the `🏹` icon and categorize them (`📜` vs `🧭`).
* **Skeleton UI:**
* Sidebar or Dialog panel listing available Templates.
* "Start Quest" button (Triggers Phase 1 Compiler).
* "Pause/Archive" controls for active quests.


* **Active Quest Tracking:** Global state to ensure only one `🧭` project is active at a time.

## Phase 3: The Game Loop (Interactivity)

*Goal: Make the Active Project reactive to user actions.*

* **Event Bridge:** Implement the `onTaskDone` listener for projects with the `🧭` suffix.
* **Grind Handler:** Logic for `Nx` tasks (immediate uncheck + title update).
* **Boss Handler:** Damage calculation and HP title updates.
* **Habit Tracker:** Incrementing progress while keeping the task `Done` for the current interval.
* **Story Step Logic:** Parent task completion check (XP award + notifications).

## Phase 4: The Resurrector (Lifecycle)

*Goal: Handle time-based resets and persistence.*

* **Reset Logic:** Implementation of `shouldResurrect` based on `@daily`/@weekly intervals.
* **Sync Service:** Automated check on app start and manual "Force Sync" button in the UI.
* **State Persistence:** Global XP and Level tracking across different quest instances.

## Phase 5: Visuals & Environment

*Goal: Polish the experience and narrative immersion.*

* **XP Visualization:** Progress bars for the global Level system in the dashboard.
* **Theming:** Logic to parse `#hexcode` or `#themename` from chapter descriptions to change SP environment colors.
* **Flavor Text UI:** A dedicated viewer for the current Story Step description within the plugin panel.

---

### Comparison of Changes

| Feature | Original Plan | Updated Plan | Reason |
| --- | --- | --- | --- |
| **Plugin UI** | Phase 4 | **Phase 2** | Allows manual E2E testing of the Compiler early on. |
| **Game Loop** | Phase 2 | **Phase 3** | Requires a compiled project to test; UI makes this easier. |
| **Testing** | Pure Unit Tests | **Integration Testing** | Real-world verification of the SP-API in the UI. |