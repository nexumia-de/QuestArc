# Plan 067: Cloning Service (The Compiler)

## Goal

Implement the **Cloning Service** as defined in Phase 1 of `docs/ROADMAP.md`. This service is responsible for instantiating a "Active Quest" (`🧭`) from a "Story Template" (`📜`).

## Requirements

1.  **Deep Copy**: Recursively copy a project/task tree.
2.  **Sanitization**: Use the parsers from `066` to strip syntax tags from titles (e.g., remove `[XP:100]`, `50x`, `⚔️`).
3.  **Injection**: Generate `QuestTaskData` using `compileTaskData` and append it to the `notes` field of the new tasks as a JSON block.
4.  **State Management**: The resulting project must have the `🧭` suffix (or indicator) to be recognized as active.

## Proposed Changes

### 1. New Service: `src/services/compiler.service.ts`

- **Dependency**: The service will need access to `PluginAPI`. To ensure testability, I will wrap `PluginAPI` calls or use dependency injection if possible, but given the global nature, I will likely mock the global `PluginAPI` object in tests.
- `compileQuest(templateProjectId: string, checkList: Task[]): Promise<string>`
  - Takes a template project ID.
  - Calls `PluginAPI.addProject({ title: "<Story Name> 🧭", ... })` to create the Active Project.
  - Iterates through the task tree of the template.
  - For each task:
    - Calls `compileTaskData(title)` to get cleaned title and `questData`.
    - Recursively handles subtasks.
    - Calls `PluginAPI.addTask({ title, projectId, note: JSON.stringify({ QUEST_DATA: ... }) })`.

### 2. Integration

- The `PluginAPI` provides `getAllProjects()`, `addProject()`, and `addTask()`, which fulfills our needs.
- `docs/SUPER_PRODUCTIVITY_API.md` confirms these methods exist.

## Verification Plan

### Automated Tests

- `src/services/compiler.service.test.ts`
  - Mock the SP API.
  - Test `compileQuest` flow:
    - Input: A mock Task tree with `[XP:100]` and `50x`.
    - Output: A new mock Task tree with `QuestTaskData` in notes and clean titles.

### Manual Verification

- Not fully possible yet without the UI to trigger it, but unit tests will cover the transformation logic.
