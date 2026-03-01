# QuestArc Agent Guidelines 🛡️📖

This document defines the strict operating procedures for developing the **QuestArc** plugin for Super Productivity.

## 🚨 CRITICAL: The Source of Truth

**The `docs/` directory is the single source of truth.**
Internal scratchpads or common training data are **subordinate** to the project documentation.

| Topic                    | Authoritative Doc                                                                                                     |
| :----------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **Development Workflow** | **[`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)**<br>_(Includes "Document-First" rules and Definition of Done)_    |
| **Architecture**         | **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)**<br>_(Split-Brain rules: Brain vs. Face)_                         |
| **Getting Started**      | **[`docs/PLUGIN_DEVELOPMENT_GUIDE.md`](./docs/PLUGIN_DEVELOPMENT_GUIDE.md)**<br>_(Setup, Troubleshooting, and Index)_ |
| **Data Types**           | **[`docs/DATA_MODELS.md`](./docs/DATA_MODELS.md)**<br>_(State, Stories, Bosses)_                                      |
| **Communication**        | **[`docs/MESSAGE_PROTOCOL.md`](./docs/MESSAGE_PROTOCOL.md)**<br>_(postMessage types)_                                 |
| **UI Design**            | **[`docs/UI_GUIDELINES.md`](./docs/UI_GUIDELINES.md)**<br>_(CSS Variables, Dark Mode)_                                |
| **Host API**             | **[`docs/SUPER_PRODUCTIVITY_API.md`](./docs/SUPER_PRODUCTIVITY_API.md)**<br>_(Super Productivity Plugin API)_         |

---

## ⚡ Core Directives

### 1. Functional & Pure

- Prefer pure functions and immutability.
- Avoid side effects outside of dedicated Services and Handlers.

### 2. The "Split-Brain" Rule

- **Brain (`src/plugin.ts`):** Source of Truth. All logic/state. Always alive.
- **Face (`src/app/App.tsx`):** Dumb UI. Ephemeral. Polls for state.
- _See `docs/ARCHITECTURE.md` for details._

### 3. The "Agentic" Workflow (MANDATORY)

**The Agent drives the process. You MUST follow this loop:**

1.  **Issue & Plan**: User selects an issue -> Agent proposes Plan in Chat.
2.  **Branch**: Agent creates `feat/<ID>-slug`.
3.  **Wipe Coding**: Agent implements changes (Mental "Vibe Coding").
4.  **Docs**: Agent creates `docs/<ID>/plan.md` & `docs/<ID>/worklog.md`.
5.  **Finish**: User reviews & pushes.
6.  **History**: Agent updates `docs/history.md`.
    - _Add the new row: `| <ID> | <Date> | <Summary> | [./<ID>/](./<ID>/) | Antigravity |`_

### 4. Definition of Done

A task is NOT done until:

- [ ] Code is written and builds (`npm run build`).
- [ ] `plan.md` is updated to reflect reality.
- [ ] `worklog.md` is created.
- [ ] `docs/history.md` is updated.
- [ ] Linting passes.

### 5. Quality Control

- **Type Safety:** Use strict types defined in `src/types/`. No `any`.
- **Linting:** Run `npm run checkFile <file>` on modified files.
- **Verification:** Ensure `npm run build` passes before finishing.
