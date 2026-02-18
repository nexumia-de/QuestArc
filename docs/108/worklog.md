# 108 – Worklog

## 2026-02-18
- Investigated all `addTask` call sites across the codebase.
- Found `prepareTaskPayload` passing `taskRepeatCfg` with `startDate: today` — a field not in `PluginCreateTaskData`.
- Removed the `taskRepeatCfg` block from `TaskService.ts`.
- Removed `isRepeating`/`repeatCfg` from `TaskDefinition` in `state.ts`.
- Cleaned `getting-started.json` story data.
- Build passes. All test failures are pre-existing.
