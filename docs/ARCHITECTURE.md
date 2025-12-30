# System Architecture

## The Split-Brain Pattern

```mermaid
graph TD
    subgraph Host["Super Productivity App"]
        Tasks[Task System]
        Storage[Persistence API]
        Header[Header UI]
    end

    subgraph Brain["Plugin Background (plugin.ts)"]
        Logic[Story Engine]
        State[QuestArc State]
        Listener[Event Listener]
    end

    subgraph Face["Plugin UI (SolidJS)"]
        View[Dashboard View]
        Anim[Animations]
    end

    Tasks -->|TASK_DONE| Listener
    Listener --> Logic
    Logic -->|Update| State
    State -->|saveData| Storage
    State -->|updateHeader| Header
    State -.->|postMessage| View
    View -.->|postMessage| Logic

```

## Critical Data Paths

1. **Persistence:** `State` -> JSON -> `Storage`
2. **Visualization:** `State` -> `Header` (Mobile/Always Visible)
3. **Interaction:** `View` -> `Brain` (e.g., Claim Reward)