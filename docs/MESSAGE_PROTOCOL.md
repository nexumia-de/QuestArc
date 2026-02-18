# Message Protocol

QuestArc uses `window.postMessage` and `BroadcastChannel` to communicate between the **Brain** (Persistent Plugin) and the **Face** (Ephemeral Iframe).

## Communication Flow

1.  **UI Request:** `App.tsx` sends a message to `window.parent`.
2.  **Brain Response:** `plugin.ts` relies on `PluginAPI.onMessage` to receive it and returns a response object (often the updated State).
3.  **Broadcasting:** For changes originating in the Brain (e.g., user completes a task in the host app), the Brain posts to `BroadcastChannel`. The UI listens to this channel and triggers a `REQUEST_SYNC`.

---

## Message Types

Defined in `src/types/messages.ts`.

### `REQUEST_SYNC`
**Direction:** UI -> Brain
**Purpose:** Get the latest state.
**Payload:** `null`
**Response:** `QuestArcState`

### `UPDATE_SETTINGS`
**Direction:** UI -> Brain
**Purpose:** Update global settings (custom tags, frequency aliases, streak behavior).
**Payload:**
```typescript
{
  settings: QuestArcState['settings']
}
```
**Response:** `QuestArcState`

### `SKIP_STEP`
**Direction:** UI -> Brain
**Purpose:** Force-advance to the next quest step, even if not all subtasks are complete. Stacked habits carry their current streak forward. Used when a user is stuck on a streak target.
**Payload:** `null`
**Response:** `QuestArcState` (with `activeStory` set)

### `START_QUEST`
**Direction:** UI -> Brain
**Purpose:** Begin a specific story.
**Payload:**
```typescript
{
  storyId: string;
}
```
**Response:** `QuestArcState` (with `activeStory` set)

### `ADD_STEP_TASKS`
**Direction:** UI -> Brain
**Purpose:** Manually trigger the creation of tasks for the current step (if they weren't auto-created).
**Payload:** `null`
**Response:** `QuestArcState`

### `ACKNOWLEDGE_COMPLETION`
**Direction:** UI -> Brain
**Purpose:** Close the "Quest Completed" overlay and reset/archive the active story.
**Payload:** `null`
**Response:** `QuestArcState`

### `SAVE_STORY`
**Direction:** UI -> Brain
**Purpose:** Create or Update a custom story.
**Payload:** `HeroStory`
**Response:** `QuestArcState`

### `DEV_RESET`
**Direction:** UI -> Brain
**Purpose:** Reset state to default (Development only).
**Payload:** `null`
**Response:** `QuestArcState` (Clean slate)

---

## Sequence Diagrams

### Starting a Quest

```mermaid
sequenceDiagram
    participant UI as Face (App.tsx)
    participant B as Brain (plugin.ts)
    participant S as State

    UI->>B: START_QUEST { storyId: "morning_routine" }
    B->>S: Update activeStory to "morning_routine"
    B->>B: Persist State
    B-->>UI: Return New State
    UI->>UI: Render Dashboard
```

### Completing a Task (External Event)

```mermaid
sequenceDiagram
    participant Host as Super Productivity
    participant B as Brain (plugin.ts)
    participant BC as BroadcastChannel
    participant UI as Face (App.tsx)

    Host->>B: Hook: taskComplete
    B->>B: Calculate Boss Damage / XP
    B->>B: Save State
    B->>BC: postMessage('UPDATE')
    
    par If UI is Open
        BC->>UI: 'UPDATE' event
        UI->>B: REQUEST_SYNC
        B-->>UI: Return New State
        UI->>UI: Update Visuals
    end
```
