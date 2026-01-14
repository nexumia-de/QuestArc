# Worklog 067: Cloning Service & Data Injection

## Summary
Implemented the **Cloning Service** which serves as the "Compiler" for the QuestArc gamification layer. It takes a template project (marked with `📜`), deep-clones it into an active project (`🧭`), sanitizes task titles (removing `[XP:...]` etc.), and injects the compiled `QUEST_DATA` into the task notes.

## Changes
- **Created** `src/types/plugin-api.ts`: Type definitions for the host `PluginAPI`.
- **Created** `src/services/compiler.service.ts`: Implemented `compileQuest` and recursive task cloning logic.
- **Created** `src/services/compiler.service.test.ts`: Unit tests verifying the cloning, sanitization, and JSON injection.

## Verification
Ran `vitest src/services/compiler.service.test.ts`.

**Results:**
```
 ✓ src/services/compiler.service.test.ts (2 tests) 8ms
   ✓ CompilerService (2)
     ✓ should compile a quest successfully
     ✓ should throw error if template project not found
```

Validated that:
1.  `[XP:...]` tags are removed from titles.
2.  `QUEST_DATA` JSON is appended to notes.
3.  Project title is renamed from `📜` to `🧭`.
4.  Subtasks are correctly cloned and linked to their new parents.
