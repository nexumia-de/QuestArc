# Contributing to QuestArc

## The "Document-First" Workflow

We follow a strict **Document-First** approach. Code is the byproduct of a well-documented plan.

### 1. Initialization
1.  Open `docs/history.md`.
2.  Find the next available **Task ID** (e.g., `040`).
3.  Create a directory: `docs/040/`.

### 2. Planning
Create `docs/040/plan.md`.
*   **Analyze:** Logic requirements? UI changes?
*   **Design:** Update `DATA_MODELS.md` or `MESSAGE_PROTOCOL.md` *drafts* if schema changes are needed.
*   **Plan:** Write a step-by-step implementation plan.

### 3. Implementation
1.  **Brain First:** Implement logic in `plugin.ts` / Services.
2.  **Face Second:** Implement UI in `App.tsx` / Views.
3.  **Run Checks:**
    *   `npm run checkFile <path>` (Prettier + Lint)
    *   `npm run build` (Type check)

### 4. Documentation & History
1.  Create `docs/040/worklog.md`.
2.  Update `docs/history.md` with a summary and link.
3.  Update the core docs (`DATA_MODELS.md`, etc.) if you changed the system architecture.

---

## ✅ Definition of Done

A task is complete only when:
- [ ] The feature works in the background (Brain logic verified).
- [ ] Data persists after a window reload.
- [ ] `docs/<ID>/plan.md` and `docs/<ID>/worklog.md` exist.
- [ ] `docs/history.md` has been updated.
- [ ] Relevant system docs (`DATA_MODELS.md`, etc.) are updated.

---

## Branching & Commits

*   **Commits:** Use conventional commits (e.g., `feat: add boss capability`, `fix: dark mode contrast`).
*   **Branches:** Feature branches preferred.

## Code Style

*   **Functional:** Prefer pure functions.
*   **KISS:** Keep It Simple.
*   **DRY:** Reuse services.
*   **Strict Types:** No `any` unless absolutely necessary (and commented).
