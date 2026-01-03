# QuestArc Plugin Development Guide

This guide explains how to develop the QuestArc plugin, bridging the standard Super Productivity Plugin API with our specific "Split-Brain" architecture.

## 📚 Documentation Map

| Doc | Purpose |
| :--- | :--- |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Deep dive into "Split-Brain", Services, and Handlers. |
| **[DATA_MODELS.md](./DATA_MODELS.md)** | Reference for `QuestArcState`, `HeroStory`, `BossConfig`, etc. |
| **[MESSAGE_PROTOCOL.md](./MESSAGE_PROTOCOL.md)** | Reference for `Brain <-> Face` communication types. |
| **[UI_GUIDELINES.md](./UI_GUIDELINES.md)** | Design system, CSS variables, and best practices. |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Workflow rules: "Document-First", Branching, and Definition of Done. |
| **[SUPER_PRODUCTIVITY_API.md](./SUPER_PRODUCTIVITY_API.md)** | The host application's API reference. |

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js (v18+)
*   npm

### 2. Setup
```bash
# Install dependencies
npm install
```

### 3. Development Loop
We use a standard "Brain First, Face Second" workflow.

1.  **Run Watch Mode:**
    ```bash
    npm run watch
    ```
    This rebuilds `dist/` on every change.

2.  **Load in Super Productivity:**
    *   Settings -> Plugins -> Load from Folder -> Select `dist/` folder (or `manifest.json`).
    *   *Tip:* You often need to reload the plugin (toggle off/on) or the app (Ctrl+R) to see changes in `plugin.ts`. UI changes in `App.tsx` might require a re-open of the plugin panel.

3.  **Debugging:**
    *   **Brain:** Check the main application console (Ctrl+Shift+I).
    *   **Face:** Right-click the plugin iframe -> Inspect.

---

## 🏗️ Architecture Overview

QuestArc uses a **Split-Brain Architecture** to handle the limitations of the plugin system (specifically the ephemeral nature of the UI iframe).

| Component | File Path | Runtime | Responsibility |
|-----------|-----------|---------|----------------|
| **The Brain** | `src/plugin.ts` | Main Process | State, Logic, Persistence, Events |
| **The Face** | `src/app/App.tsx` | Iframe | Visualization, User Input |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the complete diagram and data flow.

---

## 🛠️ Common Tasks

### Adding a New Story Type
1.  Define the schema in `src/types/story.ts` (and update [DATA_MODELS.md](./DATA_MODELS.md)).
2.  Update `StoryService` to handle creation.
3.  Update `EditorView.tsx` to include form fields.

### Adding a New Message
1.  Define the message type in `src/types/messages.ts` (and update [MESSAGE_PROTOCOL.md](./MESSAGE_PROTOCOL.md)).
2.  Add a case in `MessageHandler.ts` (Brain side).
3.  Send it from `App.tsx` or a Service (Face side).

### Debugging State Not Saving
*   **Check:** Did you call `saveState()`?
*   **Check:** Is `plugin.persistDataSynced` being called?
*   **Check:** Is the data JSON serializable? (No Functions/Circular refs).

---

## 🚫 Common Pitfalls

1.  **"My UI isn't updating!"**
    *   Check if the Polling interval is running in `App.tsx`.
    *   Check if `plugin.ts` is receiving `REQUEST_SYNC`.

2.  **"My data vanished!"**
    *   **Never** use `localStorage`. Use `PluginAPI.persistDataSynced()`.

3.  **"Images are broken."**
    *   We use `vite-plugin-singlefile`. Import images in code (`import icon from './assets/icon.svg'`) so they get inlined as Base64.
