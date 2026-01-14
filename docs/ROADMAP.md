# Technical Specification:## Phase 2: Management UI & Project Scanner (Completed)

*Goal: Provide a functional interface to trigger and manage quests.*

* **[x] Project Scanner:** Service to detect projects with the `🏹` icon and categorize them (`📜` vs `🧭`).
* **[x] Skeleton UI:**
    * Sidebar or Dialog panel listing available Templates.
    * "Start Quest" button (Triggers Phase 1 Compiler).
    * "Pause/Archive" controls for active quests.
* **[x] Active Quest Tracking:** Global state to ensure only one `🧭` project is active at a time.

---

## 2. Architecture & Data Flow

The system follows a uni-directional data flow:

1. **Scanner** reads raw projects from `PluginAPI`.
2. **Store** categorizes them into `Templates`, `Active`, and `Archived`.
3. **UI** renders based on the Store.
4. **User Actions** (Start/Pause) trigger **Services**, which update SP Projects via API, triggering a re-scan.

---

## 3. The `ProjectScannerService`

This service is the eyes of the plugin. It wraps the generic `PluginAPI.getProjects()` and applies strictly typed filtering.

### 3.1 Regex Definitions

* **Base Icon:** `🏹` (All QuestArc projects MUST have this).
* **Template:** Starts with `📜`.
* **Active:** Ends with `🧭`.
* **Paused:** Ends with `⏸️`.

### 3.2 Service Interface

```typescript
// src/services/scanner.service.ts

export interface QuestProject {
  id: string;
  title: string;
  originalTitle: string; // The title without status icons
  type: 'TEMPLATE' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'UNKNOWN';
}

export interface QuestEnvironment {
  active: QuestProject | null;
  templates: QuestProject[];
  paused: QuestProject[];
}

export class ProjectScannerService {
  /**
   * Main entry point. Fetches all projects from SP and categorizes them.
   */
  async scan(): Promise<QuestEnvironment> {
    const allProjects = await PluginAPI.getProjects(); // Mock or Real API
    
    const env: QuestEnvironment = {
      active: null,
      templates: [],
      paused: []
    };

    for (const p of allProjects) {
      // 1. Filter: Must have the Bow Icon
      if (!p.icon || p.icon !== '🏹') continue;

      // 2. Classify based on Title
      const classification = this.classifyProject(p.title);
      
      const questProj: QuestProject = {
        id: p.id,
        title: p.title,
        originalTitle: this.cleanTitle(p.title, classification),
        type: classification
      };

      switch (classification) {
        case 'ACTIVE':
          // Critical: Enforce Single Source of Truth
          if (env.active) {
            console.warn(`Integrity Warning: Multiple active quests detected. Using ${p.id}.`);
          }
          env.active = questProj;
          break;
        case 'TEMPLATE':
          env.templates.push(questProj);
          break;
        case 'PAUSED':
          env.paused.push(questProj);
          break;
      }
    }
    
    return env;
  }

  private classifyProject(title: string): QuestProject['type'] {
    if (title.endsWith('🧭')) return 'ACTIVE';
    if (title.startsWith('📜')) return 'TEMPLATE';
    if (title.endsWith('⏸️')) return 'PAUSED';
    return 'UNKNOWN';
  }

  private cleanTitle(title: string, type: QuestProject['type']): string {
    // Strips emojis based on type to get the "Core Name"
    if (type === 'TEMPLATE') return title.replace(/^📜\s*/, '');
    if (type === 'ACTIVE') return title.replace(/\s*🧭$/, '');
    if (type === 'PAUSED') return title.replace(/\s*⏸️$/, '');
    return title;
  }
}

```

---

## 4. Lifecycle Management (The Logic)

This logic resides in the `QuestManagerService`. It handles the transition between states.

### 4.1 "Start Quest" Workflow

**Input:** `templateId`
**Pre-condition:** `QuestEnvironment.active` must be `null`.

1. **Check Active:** Call `scanner.scan()`. If `active` exists, throw Error: "Please pause current quest first."
2. **Fetch Template:** Get full task tree for `templateId`.
3. **Compile:** Call `CompilerService.compileQuest(template)`.
* *Result:* A new project is created with suffix `🧭`.


4. **Refresh:** Call `scanner.scan()` to update UI.

### 4.2 "Pause Quest" Workflow

**Input:** `activeProjectId`

1. **API Call:** `PluginAPI.updateProject(id, { title: "Title ⏸️" })`.
2. **Refresh:** `scanner.scan()`.

### 4.3 "Resume Quest" Workflow

**Input:** `pausedProjectId`
**Pre-condition:** `QuestEnvironment.active` must be `null`.

1. **Check Active:** Verify no other quest is running.
2. **API Call:** `PluginAPI.updateProject(id, { title: "Title 🧭" })`.
3. **Refresh:** `scanner.scan()`.

---

## 5. UI Component Specification (Skeleton)

The UI serves as a dashboard. It should use Super Productivity's existing styling classes if available (Material Design) to blend in.

### 5.1 Component Structure

```html
<div class="quest-arc-container">
  
  <header>
    <h2>QuestArc Control</h2>
    <button (click)="refresh()" title="Scan Projects">🔄</button>
  </header>

  <section class="status-panel">
    <h3>Current Adventure</h3>
    
    <div *ngIf="state.active; else noActiveQuest" class="active-card">
      <div class="quest-title">{{ state.active.originalTitle }}</div>
      <div class="status-badge">IN PROGRESS 🧭</div>
      
      <div class="actions">
        <button (click)="pauseQuest()" class="btn-warn">Pause (Archive)</button>
        </div>
    </div>

    <ng-template #noActiveQuest>
      <div class="empty-state">No active quest. Choose a template below!</div>
    </ng-template>
  </section>

  <hr />

  <section class="templates-panel">
    <h3>Available Story Templates</h3>
    <p class="hint">Create projects starting with 📜 to see them here.</p>
    
    <ul>
      <li *ngFor="let t of state.templates">
        <span class="template-name">{{ t.originalTitle }}</span>
        <button 
          (click)="startQuest(t.id)" 
          [disabled]="state.active !== null"
          class="btn-primary">
          Start
        </button>
      </li>
    </ul>
  </section>

  <section *ngIf="state.paused.length > 0" class="paused-panel">
    <h3>Saved Games</h3>
    <ul>
      <li *ngFor="let p of state.paused">
        <span>{{ p.originalTitle }}</span>
        <button 
          (click)="resumeQuest(p.id)" 
          [disabled]="state.active !== null">
          Resume
        </button>
      </li>
    </ul>
  </section>

</div>

```

### 5.2 UI States & Feedback

1. **Loading:** While `scanner.scan()` is running, show a spinner or skeleton loader.
2. **Disabled Buttons:** If an Active Quest exists, all "Start" and "Resume" buttons must be disabled (`[disabled]`) to prevent state corruption.
3. **Error Handling:** Use a simple `alert()` or SP's notification service (snack bar) if an action fails (e.g., "Could not compile quest").

---

## 6. Implementation Steps (Detailed)

This is the exact checklist for the `worklog`.

1. **Setup Interface:** Create `src/services/scanner.service.ts`.
* Define `QuestProject` and `QuestEnvironment` interfaces.


2. **Mock Integration:** Update `src/mocks/plugin-api.mock.ts` (if used) to include `getProjects` returning a list of projects with mixed titles (`📜 A`, `B`, `C 🧭`).
3. **Implement Logic:** Write the `scan()` logic in the service.
* Unit Test: Ensure it correctly parses regex and ignores non-quest projects.


4. **Create Manager:** Create `src/services/manager.service.ts`.
* Inject `ScannerService` and `CompilerService`.
* Implement `startQuest`, `pauseQuest`, `resumeQuest`.


5. **Build UI:** Create `src/ui/dashboard/dashboard.component.ts` (or equivalent framework file).
* Bind the HTML structure defined above.
* Connect buttons to `ManagerService` methods.


6. **Manual Verification:**
* Create a project "📜 Test Story" in SP.
* Open Plugin UI -> Verify it appears in "Templates".
* Click "Start" -> Verify "Test Story 🧭" appears in sidebar and UI updates to "Active".
* Click "Pause" -> Verify title changes to "⏸️" and UI moves it to "Saved Games".



---

## 7. Edge Cases & Safety

* **Duplicate Active Quests:** The user might manually rename two projects to `... 🧭`.
* *Solution:* The Scanner alerts a warning. The UI should strictly pick the *first* one found as the "Active" one to display, or block "Start" actions until the user fixes it manually.


* **Deleted Projects:** If a project ID in the local state no longer exists in SP (user deleted it via SP UI), the `scan()` method must be robust enough not to crash and simply filter it out.
* **Race Conditions:** Disable UI buttons immediately upon click to prevent double-submissions while the API is processing.

# Technical Specification: Phase 3 – The Game Loop (Logic & Events)

## 1. Objective

Implement the "Headless RPG" engine. This phase ensures that the Active Project (`🧭`) behaves like a game. It intercepts the standard "Task Done" event in Super Productivity and modifies the task state based on the metadata (`QUEST_DATA`) injected by the Compiler in Phase 1.

## 2. Architecture: The Event Middleware

The logic hooks into the global event stream of Super Productivity.

**Trigger:** `TaskService.onTaskDone$` (or equivalent API hook).
**Filter:** Only execute if `Project.title` ends with `🧭`.

### 2.1 The Handler Dispatcher

A central service `GameLoopService` receives the event and routes it based on the `QuestTaskType`.

```typescript
// src/services/game-loop.service.ts

async function handleTaskCompletion(task: Task, project: Project) {
  // 1. Load Data: Parse JSON from task.notes
  const questData = parseQuestData(task.notes); 
  
  if (!questData) return; // Standard task, ignore.

  // 2. Dispatch
  switch (questData.meta.type) {
    case 'GRIND':
      await handleGrindTask(task, questData);
      break;
    case 'BOSS':
      await handleBossTask(task, questData);
      break;
    case 'HABIT':
      await handleHabitTask(task, questData);
      break;
  }

  // 3. Check Parent (Story Step) Progress
  if (task.parentId) {
    await checkStoryStepCompletion(task.parentId);
  }
}

```

---

## 3. Handler Logic (Detailed Algorithms)

### 3.1 Handler: `GRIND` (Immediate Repetition)

**Goal:** User checks box -> Counter goes up -> Box unchecks immediately.

1. **Read:** `current` = 5, `target` = 50.
2. **Logic:** `newCurrent = current + 1`.
3. **Update Data:** Write `{ ...progress, current: 6 }` to `task.notes`.
4. **Update UI:**
* Calculate new Title: `Pushups (6/50)`.
* Call `PluginAPI.updateTask(task.id, { title: newTitle, notes: newJson })`.


5. **Uncheck:**
* **Crucial:** Check if `newCurrent < target`.
* If yes: Call `PluginAPI.updateTask(task.id, { isDone: false })`.
* If no (Target reached): Leave `isDone: true`. Add `✅` to title.



### 3.2 Handler: `BOSS` (HP System)

**Goal:** User checks box -> Damage dealt -> HP reduces -> Box unchecks (if alive).

1. **Read:** `currentHp` = 500, `dmg` = 50 (default or from config).
2. **Logic:** `newHp = currentHp - dmg`.
3. **Update Data:** Write `{ ...progress, current: newHp }` to `task.notes`.
4. **Update UI:**
* Title: `⚔️ Goblin King (HP: 450/500)`.
* *Optional:* Update visual health bar in Plugin UI if visible.


5. **Uncheck:**
* If `newHp > 0`: Set `isDone: false`. Play "Hit Sound".
* If `newHp <= 0`: Set `isDone: true`. Play "Victory Sound". Update Title to `💀 Goblin King (Defeated)`.



### 3.3 Handler: `HABIT` (Daily/Weekly)

**Goal:** User checks box -> Counter up -> Task stays Done (for today).

1. **Read:** `current` = 2, `target` = 7.
2. **Logic:**
* `newCurrent = current + 1`.
* `lastDone = Date.now()`.


3. **Update Data:** Write JSON to `task.notes`.
4. **Update UI:** Title: `Meditation (3/7)`.
5. **Action:** **Do NOT uncheck.** The task must remain "Done" so it moves to the "Done" list/section in SP for the day.
6. **Completion Check:** If `newCurrent >= target`, the Habit is fully mastered.

### 3.4 Story Step Logic (Parent Task)

Triggered whenever a subtask changes.

1. **Fetch Parent:** Get the Parent Task.
2. **Scan Children:** Iterate all subtasks.
* Are all subtasks `isDone === true`?


3. **Result:**
* If **All Done**:
* Mark Parent as `isDone: true` (if not auto-handled by SP).
* **Award XP:** Read `[XP:100]` from Parent metadata. Add to Global Player State.
* **Notify:** Send System Notification "Chapter Complete! +100 XP".





---

# Technical Specification: Phase 4 – The Resurrector (Lifecycle)

## 1. Objective

Manage the re-occurrence of `HABIT` tasks. Since QuestArc does not use a server, this logic must run client-side to "clean up" the board for the next day.

## 2. Trigger Points

The `ResurrectorService` is invoked via:

1. **App Start:** `PluginAPI.onAppReady`.
2. **Focus Regain:** `window.onfocus` (Debounced, max once per hour) – vital for users who leave the PC running.
3. **Manual:** "Sync" button in Plugin UI.

## 3. The Algorithm (`shouldResurrect`)

**Input:** A task with `type: HABIT` and `isDone: true`.

```typescript
function checkResurrection(task: Task, questData: QuestTaskData): boolean {
  // 1. Check Global Completion
  // If the user finished the 7-day challenge, do not resurrect.
  if (questData.progress.current >= questData.progress.target) {
    return false; 
  }

  const lastDone = new Date(questData.routine.lastDone);
  const now = new Date();
  
  // 2. Frequency Logic
  if (questData.routine.frequency === '@daily') {
    // Logic: Is "Now" a different calendar day than "LastDone"?
    return !isSameDay(lastDone, now);
  }
  
  if (questData.routine.frequency === '@weekly') {
    // Logic: Is "Now" in a different ISO week than "LastDone"?
    return !isSameWeek(lastDone, now);
  }

  return false;
}

```

## 4. Execution (The Batch Update)

To prevent UI lag, updates should be batched.

1. **Scan:** Iterate all `isDone` tasks in the Active Project.
2. **Filter:** Collect tasks where `checkResurrection() === true`.
3. **Process:**
* For each task:
* Set `isDone: false`.
* Remove `✅` or checkmark from title (clean up string).
* Move task from "Done" list back to "Backlog" or "Today" (depending on config/SP behavior).




4. **Notify:** "QuestArc: 3 Daily Habits reset for today."

---

# Implementation Plan (Combined)

### Phase 3 Steps

1. **Service Setup:** Create `GameLoopService`.
2. **Parser:** Implement `parseQuestData` (safely extract JSON from string).
3. **Event Hook:** Subscribe to `onTaskDone`.
4. **Implementation:** Write handlers for `GRIND`, `BOSS`, `HABIT`.
5. **Testing:**
* Create Active Project with `5x Pushups`.
* Check box -> Verify title changes to `(1/5)` and box unchecks.



### Phase 4 Steps

1. **Service Setup:** Create `ResurrectorService`.
2. **Date Logic:** Implement `isSameDay` / `isSameWeek` utilities.
3. **Sync Logic:** Implement the scan-and-update loop.
4. **Testing:**
* Create `1x @daily`. Mark done.
* Manually manipulate `lastDone` JSON in note to yesterday.
* Click "Force Sync" -> Verify task re-opens.