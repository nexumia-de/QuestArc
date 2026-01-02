# QuestArc Agent Guidelines 🛡️📖

This document defines the strict operating procedures for developing the **QuestArc** plugin for Super Productivity.

## General Guidelines

1. Prefer functional programming patterns: Use pure functions, immutability, and avoid side effects where possible.
2. KISS (Keep It Simple, Stupid): Aim for simplicity and clarity in code. Avoid unnecessary complexity and abstractions.
3. DRY (Don't Repeat Yourself): Reuse code where possible. Create utility functions or services for common logic, but avoid unnecessary abstractions.
4. Confirm understanding before making changes: If you're unsure about the purpose of a piece of code, ask for clarification rather than making assumptions.
5. **ALWAYS** use `npm run checkFile <filepath>` on each file you modify to ensure proper formatting and linting. This runs both prettier and lint checks on individual files. Unless you want to lint and format multiple files, then use `npm run prettier` and `npm run lint` instead.
6. When creating html templates, prefer plain html like `<table>` and `<div>`. Keep CSS styles to a minimum. Keep nesting to a minimum. Keep css classes to a minimum. Use Angular Material components where appropriate, but avoid overusing them.


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
1.  Open `docs/history.md` to find the next available **Task ID** (e.g., `001`).
2.  Create a directory: `docs/<ID>/`.

### Step 2: Planning
Create `docs/<ID>/plan.md` using the template (`docs/templates/plan.md`).
* **Analyze:** Does this feature require persistence? If yes, design the `plugin.ts` logic first.
* **Define Protocol:** If the UI needs to send commands or request data, define the message type in `src/types/messages.ts`.
* **Note:** The UI polls for state updates every 2 seconds. Real-time push updates from plugin.ts are not possible.

### Step 3: Implementation
1.  **Brain First:** Implement logic in `plugin.ts`. Ensure it works without the UI open (verify via logs or header updates).
2.  **Face Second:** Implement the SolidJS UI to reflect the new state.
3.  **Build & Test:**
    - Run `npm run build` to build the plugin
    - Run `npm run package` to create the installable `.zip` file

### Step 4: Logging & History
1.  Create `docs/<ID>/worklog.md` detailing what was actually done.
2.  **MANDATORY:** Update `docs/history.md` with a one-sentence summary and link.

---

## 🛠 Technical Standards

### Persistence
* **Never** use `localStorage` in SolidJS.
* **Always** use `plugin.persistDataSynced(JSON.stringify(state))` in `plugin.ts`.

### UI & Design
* **Primary Reference:** Follow `docs/UI_GUIDELINES.md` for all UI/UX decisions.
* **Design System:** Use the CSS variables defined in `docs/UI_GUIDELINES.md` (e.g., `--primary`, `--hp-color`).
* **Mobile First:** Ensure all touch targets are accessible (min 44px).

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