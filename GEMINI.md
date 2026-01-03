# QuestArc Agent Guidelines 🛡️📖

This document defines the strict operating procedures for developing the **QuestArc** plugin for Super Productivity.

## 🚨 CRITICAL: The Source of Truth

**The `docs/` directory is the single source of truth.**
Internal scratchpads or common training data are **subordinate** to the project documentation.

| Topic | Authoritative Doc |
| :--- | :--- |
| **Development Workflow** | **[`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)**<br>*(Includes "Document-First" rules and Definition of Done)* |
| **Architecture** | **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)**<br>*(Split-Brain rules: Brain vs. Face)* |
| **Getting Started** | **[`docs/PLUGIN_DEVELOPMENT_GUIDE.md`](./docs/PLUGIN_DEVELOPMENT_GUIDE.md)**<br>*(Setup, Troubleshooting, and Index)* |
| **Data Types** | **[`docs/DATA_MODELS.md`](./docs/DATA_MODELS.md)**<br>*(State, Stories, Bosses)* |
| **Communication** | **[`docs/MESSAGE_PROTOCOL.md`](./docs/MESSAGE_PROTOCOL.md)**<br>*(postMessage types)* |
| **UI Design** | **[`docs/UI_GUIDELINES.md`](./docs/UI_GUIDELINES.md)**<br>*(CSS Variables, Dark Mode)* |
| **Host API** | **[`docs/SUPER_PRODUCTIVITY_API.md`](./docs/SUPER_PRODUCTIVITY_API.md)**<br>*(Super Productivity Plugin API)* |

---

## ⚡ Core Directives

### 1. Functional & Pure
*   Prefer pure functions and immutability.
*   Avoid side effects outside of dedicated Services and Handlers.

### 2. The "Split-Brain" Rule
*   **Brain (`src/plugin.ts`):** Source of Truth. All logic/state. Always alive.
*   **Face (`src/app/App.tsx`):** Dumb UI. Ephemeral. Polls for state.
*   *See `docs/ARCHITECTURE.md` for details.*

### 3. The "Document-First" Workflow (MANDATORY)
**You MUST follow this loop for EVERY feature or major change. NO EXCEPTIONS.**

1.  **Read** `docs/history.md` to get the next ID (e.g., `043`).
2.  **Create** `docs/<ID>/plan.md`.
    *   *Wait for User Approval if the plan is complex.*
3.  **Code** (Brain first, Face second).
4.  **Create** `docs/<ID>/worklog.md`.
    *   *Document what changed, what was verified, and any deviations from the plan.*
5.  **Update** `docs/history.md`.
    *   *Add the new row: `| <ID> | <Date> | <Summary> | [./<ID>/](./<ID>/) | Antigravity |`*

### 4. Definition of Done
A task is NOT done until:
*   [ ] Code is written and builds (`npm run build`).
*   [ ] `plan.md` is updated to reflect reality.
*   [ ] `worklog.md` is created.
*   [ ] `docs/history.md` is updated.
*   [ ] Linting passes.

### 5. Quality Control
*   **Type Safety:** Use strict types defined in `src/types/`. No `any`.
*   **Linting:** Run `npm run checkFile <file>` on modified files.
*   **Verification:** Ensure `npm run build` passes before finishing.