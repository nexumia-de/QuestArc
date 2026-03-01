# Contributing to QuestArc

## The "Agentic" Workflow with Wipe Coding

We follow a strict **Agent-First** approach. The Agent (Antigravity) drives the development process under User supervision.

### 1. Issue Discovery & Selection

1.  **Agent:** Checks Codeberg for open issues (`is:open`).
2.  **User:** Selects an issue to work on.

### 2. Planning & Branching

1.  **Agent:** Analyzes the issue and proposes a **Implementation Plan** in the Chat.
    - _If approved:_ Agent posts the plan as a **Comment** on the Codeberg Issue.
2.  **Agent:** Creates a new feature branch:
    - `git checkout -b feat/<issue-id>-<short-slug>`

### 3. Implementation (Wipe Coding)

- **Mental Model:** "Wipe Coding" / "Vibe Coding".
- **Agent:** Writes the code. Focus on clean, functional implementations.
  - _Prefer rewriting entire modules/files for clarity over brittle patches._
- **Documentation:**
  - Agent creates `docs/<ID>/plan.md` (The approved plan).
  - Agent creates `docs/<ID>/worklog.md` (What was actually done).

### 4. Verification & Push

1.  **Agent:** Runs checks (`npm run checkFile`, `npm run build`).
2.  **User:** Reviews the changes and the `worklog.md`.
3.  **User:** Manually pushes the changes to Codeberg.

---

## Branching & Commits

- **Commits:** Use conventional commits (e.g., `feat: add boss capability`, `fix: dark mode contrast`).
- **Branches:** Feature branches preferred.

## Code Style & Standards

- **Component Syntax:** Always use `const Name: Component<Props> = (props) => ...`. Do not use `function Name()`.
- **Top-Level Elements:** Use semantic tags (e.g., `<section>`) for View roots, not `<div>`.
- **Import Order:**
  1.  External Libraries (`solid-js`, etc.)
  2.  Types (`../types/...`)
  3.  Services/Lib (`../services/...`)
  4.  Components (`./Folder/...`)
  5.  Styles (`./File.css`)
- **Functional:** Prefer pure functions.
- **KISS:** Keep It Simple.
- **DRY:** Reuse services.
- **Strict Types:** No `any` unless absolutely necessary (and commented).
