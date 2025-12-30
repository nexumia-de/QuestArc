# Implementation Plan - Task <ID>

**Goal:** <One sentence summary of the objective>

## ⚠️ User Review Required
> [!IMPORTANT]
> List critical design decisions, breaking changes, or "points of no return" that the user must approve.
> *Example: "This changes the save format and is not backward compatible."*

## 🧠 Brain (`src/plugin.ts`)
* **State Changes:** <Does `QuestArcState` need new fields?>
* **Persistence:** <Does this data need to survive a reload? If yes, it goes here.>
* **Logic:** <How is the new mechanic calculated? (Level ups, damage, etc.)>

## 🎨 Face (`src/app/` & SolidJS)
* **Visuals:** <Color palette, typography, or animation changes.>
* **Components:** <New components or modifications to existing ones.>
* **Protocol:** <What new `MESSAGE_TYPES` are needed to talk to the Brain?>

## 📋 Step-by-Step Implementation
*Break down the work into atomic file changes.*

### 1. Brain (Logic)
- [ ] [MODIFY] `src/plugin.ts`: <Description>
- [ ] [NEW] `src/types/messages.ts`: <Description>

### 2. Face (UI)
- [ ] [MODIFY] `src/app/App.tsx`: <Description>
- [ ] [NEW] `src/app/components/NewWidget.tsx`: <Description>

## 🧪 Verification
* **Automated:** `npm run typecheck`, `npm run lint`
* **Mobile/Background:** <How will we verify this works when the plugin tab is closed?>
* **Visual:** <What should the user look for?>