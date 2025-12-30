# QuestArc Agent Guidelines 🛡️📖

This document defines the strict operating procedures for developing the **QuestArc** plugin for Super Productivity.

## 📂 Project Architecture: The "Split-Brain" Rule

QuestArc is built on the `super-productivity/boilerplate-solid-js`, which enforces a strict separation of concerns. **You must respect this split to ensure the plugin works on mobile devices.**

### 1. The Brain (`src/plugin.ts`)
* **Runtime:** Runs in the main application process. **Always alive.**
* **Responsibilities:**
    * **Source of Truth:** Holds the master state (Boss HP, XP, Current Story Step).
    * **Event Listener:** Reacts to `TASK_DONE` and `TIMER_DONE`.
    * **Persistence:** Saves state via `plugin.saveData()`.
    * **Header UI:** Updates the "Boss HP" button in the app header (crucial for mobile visibility).
* **Rule:** **ALL** game logic (damage calc, level ups) must happen here.

### 2. The Face (`src/app/App.tsx` & SolidJS)
* **Runtime:** Runs in an isolated `iframe`. **Ephemeral** (dies when tab closes).
* **Responsibilities:**
    * **Visualization:** Displays story text, progress bars, and animations.
    * **State Polling:** Polls the Brain every 2 seconds for state updates via `postMessage`.
    * **Command Sender:** Sends user intents (e.g., "Reset Progress") to the Brain via `postMessage`.
* **Rule:** Never calculate game state here. Always request it from the Brain.
* **Important:** The Brain cannot push updates to the UI. The UI must poll for changes.

---

## 🔄 The "Document-First" Workflow

Every task requires a specific documentation trail. **Do not write code without a plan.**

### Step 1: Initialization
1.  Check `docs/IMPROVEMENTS.md` for the next priority.
2.  Open `docs/history.md` to find the next available **Task ID** (e.g., `001`).
3.  Create a directory: `docs/<ID>/`.

### Step 2: Planning
Create `docs/<ID>/plan.md` using the template (`docs/templates/plan.md`).
* **Analyze:** Does this feature require persistence? If yes, design the `plugin.ts` logic first.
* **Define Protocol:** If the UI needs to send commands or request data, define the message type in `src/types/messages.ts`.
* **Note:** The UI polls for state updates every 2 seconds. Real-time push updates from plugin.ts are not possible.

### Step 3: Implementation
1.  **Brain First:** Implement logic in `plugin.ts`. Ensure it works without the UI open (verify via logs or header updates).
2.  **Face Second:** Implement the SolidJS UI to reflect the new state.
3.  **Verify:** Run `npm run deploy` (or `build`) and test the feature.

### Step 4: Logging & History
1.  Create `docs/<ID>/worklog.md` detailing what was actually done.
2.  **MANDATORY:** Update `docs/history.md` with a one-sentence summary and link.

---

## 🛠 Technical Standards

### Persistence
* **Never** use `localStorage` in SolidJS.
* **Always** use `plugin.persistDataSynced(JSON.stringify(state))` in `plugin.ts`.

### Mobile Compatibility
* Use `plugin.registerHeaderButton` for status indicators (limited to initial state, can't update dynamically).
* Ensure the SolidJS UI is responsive.
* **Build Command:** Use `npm run build` (asset inlining happens automatically via vite-plugin).

### Code Quality
* **Strict Types:** Use the `HeroStory` and `QuestArcState` interfaces shared between Brain and Face (located in `src/types/`).
* **No Magic Strings:** Use constants for Message Types.

---

## ✅ Definition of Done
A task is complete only when:
- [ ] The feature works even if the plugin tab is closed (Background check).
- [ ] Data persists after a window reload.
- [ ] `docs/<ID>/plan.md` and `docs/<ID>/worklog.md` exist.
- [ ] `docs/history.md` has been updated.