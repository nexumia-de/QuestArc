# Audit Report: QuestArc Codebase
**Date**: 2026-02-02
**Auditor**: Senior Software Architect (Antigravity)
**Scope**: Full Codebase Review (Architecture, Consistency, Quality, Doc-Drift)

---

## 1. Executive Summary

The **QuestArc** codebase demonstrates a solid foundational architecture complying with the "Split-Brain" pattern required for Super Productivity plugins. The separation of concerns between the persistent "Brain" (`src/plugin.ts`) and the ephemeral "Face" (`src/app/App.tsx`) is well-maintained.

However, the project is suffering from **Complexity Bloat**. Core logic files (`game-logic.ts`, `TaskCompletionHandler.ts`) have become monolithic, mixing business rules, state management, and UI notification logic. This violates the Single Responsibility Principle (SRP) and makes testing/maintenance difficult.

Security risks are low due to the local nature of the plugin, but "Error Swallowing" (empty catch blocks) poses a stability risk.

## 2. Detailed Defect List

### 🔴 Blocker / Critical (Immediate Action Required)
*   **Error Swallowing**: Multiple instances of `try { ... } catch (e) { /* ignore */ }` in `TaskCompletionHandler.ts` and `game-logic.ts`. This makes debugging runtime failures involving JSON parsing or API errors nearly impossible.
*   **Type Safety Gaps**: Widespread use of `as any` casting in `plugin.ts` hooks and `TaskCompletionHandler`. This defeats TypeScript's safety guarantees at the most critical "IO" boundaries (hooks).

### 🟠 Major (High Priority)
*   **Monolithic Files**:
    *   `src/lib/game-logic.ts` (530+ lines): Handles parsing, XP, Leveling, Boss Damage, Streak Logic, and Frequency. Needs splitting.
    *   `src/handlers/TaskCompletionHandler.ts` (580+ lines): Contains deeply nested conditional logic for "Structure Guard", "Boss Guard", "Sibling scanning", and "Auto-complete".
*   **Logic Duplication**:
    *   JSON Note Parsing is repeated in `TaskService.ts` (`checkDailyResets`), `TaskCompletionHandler.ts`, and `game-logic.ts`.
    *   Damage calculation logic exists inline in `processTaskCompletion` despite a comment saying `calculateDamage` was removed.
*   **Magic Strings**:
    *   Hardcoded strings: `'BOSS'`, `'GRIND'`, `'HABIT'`, `'#QuestArc'`, `'taskComplete'`. Typos here will silently fail.

### 🟡 Minor (Polish / Maintenance)
*   **Documentation Drift**:
    *   `ARCHITECTURE.md` is mostly accurate but simplifies the complexity of `TaskCompletionHandler`.
    *   `game-logic.ts` comments refer to deprecated functions that were removed but logic remains inline.
*   **Console Logging**: `PluginService.log` usage is inconsistent (sometimes `console.log` is used directly in `game-logic.ts`).

---

## 3. Improvement Plan (Roadmap)

To be executed sequentially.

### Phase 1: Stability & Safety (The Foundation)
1.  **Strict Types**: Define shared interfaces for `TaskHookPayload` and `TaskNoteJSON`. Remove `as any` in `plugin.ts` and `TaskCompletionHandler.ts`.
2.  **Error Handling Strategy**: Replace empty `catch` blocks with `PluginService.log.error()`.
3.  **Constants**: Extract magic strings to `src/constants.ts` (e.g., `TaskTypes`, `HookNames`).

### Phase 2: Deconstruction (Refactoring)
4.  **Extract Parsers**: Create `src/lib/parsers/NoteParser.ts` to centralize JSON extraction/safe-parsing logic.
5.  **Split Game Logic**:
    *   `src/lib/logic/XpLogic.ts` (Leveling/XP)
    *   `src/lib/logic/BossLogic.ts` (Damage/HP)
    *   `src/lib/logic/StreakLogic.ts` (Habits/Grinds)
6.  **Refactor Handlers**: Move "Guard" logic from `TaskCompletionHandler` into dedicated Validator functions (e.g., `validateTaskCompletion(task, state)`).

### Phase 3: Consistency
7.  **Unify Logging**: Ensure `game-logic.ts` uses `PluginService.log` instead of `console.log`.
8.  **Sync Docs**: Update `ARCHITECTURE.md` to reflect the new modular structure.

---

**Status**: Ready for approval. Awaiting signal to start Phase 1.
