# 109 – Habit Stacking

## Problem

When a quest step completes, habits (recurring subtasks) are left behind as "done" tasks. If the next step has the same habit with a higher goal, the user starts from scratch — losing their streak, tier, and history.

## Goal

Habits marked with `[stack:id]` carry their streak data from one step to the next, so the user progresses through escalating habit challenges without losing momentum.

## Design Decisions

| Decision              | Choice                                                      |
| --------------------- | ----------------------------------------------------------- |
| **Approach**          | Clone & Hydrate — new task per step, inject old streak data |
| **Stacking identity** | New `[stack:id]` tag — matches habits across steps          |
| **Grimoire grouping** | `[persistent:group]` unchanged — separate concern           |
| **Blocked user**      | "Skip to Next Step" button in plugin UI                     |

## Template Example

```
📜 Build a Morning Routine
├── Step 1: "Baby Steps"
│   ├── Walk 5 min [freq:daily] [streak:3] [persistent:Morgenroutine] [stack:walk]
│   └── Meditate 2 min [freq:daily] [streak:3] [persistent:Morgenroutine] [stack:meditate]
├── Step 2: "Building Up"
│   ├── Walk 10 min [freq:daily] [streak:7] [persistent:Morgenroutine] [stack:walk]
│   └── Meditate 5 min [freq:daily] [streak:7] [persistent:Morgenroutine] [stack:meditate]
└── Step 3: "Making It Stick"
    ├── Walk 15 min [freq:daily] [streak:14] [persistent:Morgenroutine] [stack:walk]
    └── Meditate 10 min [freq:daily] [streak:14] [persistent:Morgenroutine] [stack:meditate]
```

## Streak Carry-Over Rules

| Field                     | Carried | Reset                |
| ------------------------- | ------- | -------------------- |
| `streak.current`          | ✅      |                      |
| `streak.highest`          | ✅      |                      |
| `streak.tier`             | ✅      |                      |
| `streak.totalCompletions` | ✅      |                      |
| `streak.availableGrace`   | ✅      |                      |
| `streak.target`           |         | ✅ from new template |
| `progress.current`        |         | ✅ to 0              |
| `progress.lastDoneDate`   | ✅      |                      |
| Task title                |         | ✅ from new template |

## Changes

### Phase 1: Core Stacking

- **`src/types/quest-v2.ts`**: Add `stack?: string` to `QuestTaskData.meta`
- **`src/lib/parsers.ts`**: Parse `[stack:X]` from titles, store in `meta.stack`, strip from clean title
- **`src/services/compiler.service.ts`**: In `compileNextTask`, fetch old step's completed habits, match by `stack` ID, inject streak data into new clone
- **`src/lib/parsers.test.ts`**: Test `[stack:X]` parsing
- **`src/services/compiler.service.test.ts`**: Test streak injection during `compileNextTask`

### Phase 2: Skip to Next Step

- **`src/types/messages.ts`**: Add `SKIP_STEP` message type
- **`src/handlers/MessageHandler.ts`**: Handle `SKIP_STEP` — force-complete open subtasks, trigger `compileNextTask`
- **`src/app/App.tsx`**: Add "Skip to Next Step" button (visible when quest active)

### Phase 3: Documentation

- **`docs/SYNTAX_GUIDE.md`**: Add `[stack:X]` section
- **`docs/MESSAGE_PROTOCOL.md`**: Add `SKIP_STEP` message type
- **`docs/DATA_MODELS.md`**: Update `QuestTaskData.meta` with `stack` field
