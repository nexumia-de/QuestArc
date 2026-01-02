# QuestArc Plugin Development Guide

This guide explains how to develop the QuestArc plugin, bridging the standard Super Productivity Plugin API with our specific "Split-Brain" architecture.

## 🏗️ Architecture Overview

QuestArc uses a **Split-Brain Architecture** to handle the limitations of the plugin system (specifically the ephemeral nature of the UI iframe).

| Component | File Path | Standard Plugin Type | Runtime | Responsibility |
|-----------|-----------|----------------------|---------|----------------|
| **The Brain** | `src/plugin.ts` | JavaScript Plugin | Persistent (Main Process) | State, Logic, Persistence, Events |
| **The Face** | `src/app/App.tsx` | HTML/Iframe Plugin | Ephemeral (Iframe) | Visualization, User Input |

---

## 🧠 The Brain (`src/plugin.ts`)

The "Brain" is the entry point defined in `manifest.json` as `main`. It runs in the main application context.

### Key Responsibilities

1.  **State Management:**
    *   It holds the `QuestArcState` in memory.
    *   It is the **Single Source of Truth**.
    *   It handles all game logic (XP gain, Boss damage).

2.  **Persistence:**
    *   Uses `PluginAPI.loadSyncedData()` on init.
    *   Uses `PluginAPI.persistDataSynced()` after every state change.
    *   *Note:* `localStorage` is not reliable here; use the API.

3.  **Event Listening (Hooks):**
    *   Registers hooks like `PluginAPI.registerHook('taskComplete', ...)` to react to user actions even when the UI is closed.

4.  **Header UI:**
    *   Uses `PluginAPI.registerHeaderButton()` to show basic status (HP/Level).
    *   *Limitation:* These buttons are static after registration. To update them, we would need to re-register (which is messy), so we mostly use them as static entry points or status indicators that update only on reload/init.

5.  **Communication Hub:**
    *   Listens for messages from the UI via `PluginAPI.onMessage`.
    *   Sends state back to the UI when requested (`REQUEST_SYNC`).

### Code Pattern (Brain)

```typescript
// src/plugin.ts
let state = ...; // In-memory state

// 1. Listen for App Events
PluginAPI.registerHook('taskComplete', (payload) => {
  // modify state...
  saveState();
});

// 2. Handle UI Requests
PluginAPI.onMessage((msg) => {
  if (msg.type === 'REQUEST_SYNC') {
    return state; // Send state back to UI
  }
});
```

---

## 🤡 The Face (`src/app/App.tsx`)

The "Face" is the SolidJS application that gets compiled into `index.html`. It runs inside a sandboxed iframe when the user clicks the header button.

### Key Responsibilities

1.  **Visualization:** Renders the rich UI (Story text, Boss animations, Progress bars).
2.  **Polling:** Because the Brain cannot *push* messages to the Iframe (easily), the Face *pulls* data.
    *   It sends `REQUEST_SYNC` to the Brain every 2 seconds.
3.  **Commanding:** Sends user intents (e.g., "Start Quest", "Reset") to the Brain.

### Build Process
*   We use `vite` with `vite-plugin-singlefile` (or similar logic via `@super-productivity/vite-plugin`) to inline **ALL** CSS and JS into a single `index.html`.
*   External resources (images, fonts) must be inlined or base64 encoded.

### Code Pattern (Face)

```tsx
// src/app/App.tsx
onMount(() => {
  // Poll for state every 2s
  setInterval(async () => {
    const freshState = await window.PluginAPI.postMessage({ type: 'REQUEST_SYNC' });
    setState(freshState);
  }, 2000);
});

const handleReset = () => {
  // Send command to Brain
  window.PluginAPI.postMessage({ type: 'DEV_RESET' });
};
```

---

## 🛠️ Development Workflow

### 1. Modifying State/Logic
*   **Where:** `src/lib/game-logic.ts` called by `src/plugin.ts`.
*   **Rule:** Logic must be pure and testable.
*   **Verify:** Check console logs in the main app to see "QuestArc: Task completed!" even with the plugin UI closed.

### 2. Modifying UI
*   **Where:** `src/app/App.tsx`.
*   **Rule:** Never calculate game state here. Only display it.
*   **Preview:** You can run `npm run dev` to see the UI in a browser, but it won't have access to the real `PluginAPI`. Mock data is often needed for local dev.

### 3. Building & Testing
1.  **Build:** `npm run build`
    *   Compiles `src/plugin.ts` -> `dist/plugin.js`
    *   Compiles `src/app/` -> `dist/index.html` (with inlined assets)
2.  **Package:** `npm run package`
    *   Zips `dist/` + `manifest.json` -> `dist/quest-arc.zip`
3.  **Install:**
    *   Go to Super Productivity -> Settings -> Plugins.
    *   Load the `manifest.json` or the `.zip` file.

---

## 🚫 Common Pitfalls

1.  **"My UI isn't updating!"**
    *   Check if the Polling interval is running.
    *   Check if `plugin.ts` is actually receiving the `REQUEST_SYNC` message.

2.  **"My data vanished!"**
    *   Did you use `localStorage`? Don't. Use `PluginAPI.persistDataSynced()`.
    *   Did you forget to `saveState()` after modifying it in `plugin.ts`?

3.  **"Images are broken."**
    *   In the iframe, you cannot reference local files like `<img src="./icon.png">` easily once packaged.
    *   Best practice: Import images in code (`import icon from './assets/icon.svg'`) so Vite inlines them as Base64.

4. **"Git says packages/ are modified"**

    *   We are "vendoring" these packages. It is normal that they are part of your repository now. If you update them from the upstream Super Productivity repo, you should commit those changes.

## 📚 API Reference

See `docs/plugin-development.md` for the official API documentation (available methods, hooks, etc.).
