# Super Productivity Plugin API Reference

> [!NOTE]
> This document is a reference for the **host application's API** (@super-productivity/plugin-api). 
> For QuestArc-specific development guidelines, please see [PLUGIN_DEVELOPMENT_GUIDE.md](./PLUGIN_DEVELOPMENT_GUIDE.md).

This guide covers the available methods provided by the Super Productivity Plugin System.

These docs might not always be perfectly up to date. You find the latest typescript interfaces here:
[types.ts](../packages/plugin-api/src/types.ts)

## Table of Contents

- [Available API Methods](#available-api-methods)
- [Plugin Manifest](#plugin-manifest)
- [Plugin Types](#plugin-types)

## Available API Methods

### Data Operations

#### Tasks

- `getTasks()` - Get all active tasks
- `getArchivedTasks()` - Get archived tasks
- `getCurrentContextTasks()` - Get tasks in current context
- `addTask(task)` - Create a new task
- `updateTask(taskId, updates)` - Update existing task

#### Projects

- `getAllProjects()` - Get all projects
- `addProject(project)` - Create new project
- `updateProject(projectId, updates)` - Update project

#### Tags

- `getAllTags()` - Get all tags
- `addTag(tag)` - Create new tag
- `updateTag(tagId, updates)` - Update tag

#### Simple Counters
Simple counters let you track lightweight metrics (e.g., daily clicks or habits) that persist and sync with your data. There are two levels: **basic** (key-value pairs for today's count) and **full model** (full CRUD on `SimpleCounter` entities with date-specific values).

##### Basic Counters
These treat counters as a simple `{ [id: string]: number }` map for today's values (auto-upserts via NgRx).

| Method | Description | Example |
|--------|-------------|---------|
| `getAllCounters()` | Get all counters as `{ [id: string]: number }` | `const counters = await PluginAPI.getAllCounters(); console.log(counters['my-key']);` |
| `getCounter(id)` | Get today's value for a counter (returns `null` if unset) | `const val = await PluginAPI.getCounter('daily-commits');` |
| `setCounter(id, value)` | Set today's value (non-negative number; validates id regex `/^[A-Za-z0-9_-]+$/`) | `await PluginAPI.setCounter('daily-commits', 5);` |
| `incrementCounter(id, incrementBy = 1)` | Increment and return new value (floors at 0) | `const newVal = await PluginAPI.incrementCounter('daily-commits', 2);` |
| `decrementCounter(id, decrementBy = 1)` | Decrement and return new value (floors at 0) | `const newVal = await PluginAPI.decrementCounter('daily-commits');` |
| `deleteCounter(id)` | Delete the counter | `await PluginAPI.deleteCounter('daily-commits');` |

##### Full SimpleCounter Model
For advanced use: Full CRUD on counters with metadata (title, enabled state, date-specific values via `countOnDay: { [date: string]: number }`).

| Method | Description | Example |
|--------|-------------|---------|
| `getAllSimpleCounters()` | Get all as `SimpleCounter[]` | `const all = await PluginAPI.getAllSimpleCounters();` |
| `getSimpleCounter(id)` | Get one by id (returns `undefined` if not found) | `const counter = await PluginAPI.getSimpleCounter('my-id');` |
| `updateSimpleCounter(id, updates)` | Partial update (e.g., `{ title: 'New Title', countOnDay: { '2025-11-17': 10 } }`) | `await PluginAPI.updateSimpleCounter('my-id', { isEnabled: false });` |
| `toggleSimpleCounter(id)` | Toggle `isOn` state (throws if not found) | `await PluginAPI.toggleSimpleCounter('my-id');` |
| `setSimpleCounterEnabled(id, isEnabled)` | Set enabled state | `await PluginAPI.setSimpleCounterEnabled('my-id', true);` |
| `deleteSimpleCounter(id)` | Delete by id | `await PluginAPI.deleteSimpleCounter('my-id');` |
| `setSimpleCounterToday(id, value)` | Set today's value (YYYY-MM-DD) | `await PluginAPI.setSimpleCounterToday('my-id', 10);` |
| `setSimpleCounterDate(id, date, value)` | Set value for specific date (validates YYYY-MM-DD) | `await PluginAPI.setSimpleCounterDate('my-id', '2025-11-16', 5);` |

### UI Operations

#### Notifications

```javascript
// Show snackbar notification
PluginAPI.showSnack({
  msg: 'Operation completed!',
  type: 'SUCCESS', // SUCCESS, ERROR, INFO, WARNING
  ico: 'check', // Optional Material icon
  actionStr: 'Undo', // Optional action button
  actionFn: () => console.log('Undo clicked'),
});

// System notification
PluginAPI.notify({
  title: 'Task Complete',
  body: 'Great job!',
  ico: 'done',
});
```

#### Dialogs

```javascript
// Open a dialog
const result = await PluginAPI.openDialog({
  title: 'Confirm Action',
  content: 'Are you sure?',
  okBtnLabel: 'Yes',
  cancelBtnLabel: 'No',
});
```

### Registration Methods (plugin.js only)

#### Header Button

```javascript
PluginAPI.registerHeaderButton({
  id: 'my-header-btn', // Optional unique ID
  label: 'Click Me',
  icon: 'star', // Material icon name
  onClick: () => {
    console.log('Header button clicked');
  },
});
```

#### Menu Entry

```javascript
PluginAPI.registerMenuEntry({
  label: 'My Plugin Action',
  icon: 'extension',
  onClick: () => {
    console.log('Menu item clicked');
  },
});
```

#### Side Panel Button

```javascript
PluginAPI.registerSidePanelButton({
  label: 'My Panel',
  icon: 'dashboard',
  onClick: () => {
    PluginAPI.showIndexHtmlAsView();
  },
});
```

#### Keyboard Shortcut

```javascript
PluginAPI.registerShortcut({
  keys: 'ctrl+shift+p',
  label: 'My Plugin Shortcut',
  action: () => {
    console.log('Shortcut triggered');
  },
});
```

#### Hooks

```javascript
// Available hooks
const hooks = {
  TASK_COMPLETE: 'taskComplete',
  TASK_UPDATE: 'taskUpdate',
  TASK_DELETE: 'taskDelete',
  CURRENT_TASK_CHANGE: 'currentTaskChange',
  FINISH_DAY: 'finishDay',
  LANGUAGE_CHANGE: 'languageChange',
  PERSISTED_DATA_UPDATE: 'persistedDataUpdate',
  ACTION: 'action',
};

// Register hook listener
PluginAPI.registerHook(PluginAPI.Hooks.TASK_COMPLETE, (taskId) => {
  console.log(`Task ${taskId} completed!`);
});

// Listen to Redux actions
PluginAPI.registerHook(PluginAPI.Hooks.ACTION, (action) => {
  if (action.type === 'ADD_TASK_SUCCESS') {
    console.log('New task added:', action.payload);
  }
});
```

### Data Persistence

You can persist data that will also be synced vai the `persistDataSynced` and `loadSyncedData` APIs. For local storage I recommend using `localStorage`.

```javascript
// Save plugin data
await PluginAPI.persistDataSynced('myKey', { count: 42 });

// Load saved data
const data = await PluginAPI.loadSyncedData('myKey');
console.log(data); // { count: 42 }
```
