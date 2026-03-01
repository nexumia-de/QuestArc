# QuestArc

> Gamify your productivity with epic stories and boss battles

QuestArc is a plugin for [Super Productivity](https://super-productivity.com) that transforms your task completion into an RPG-style adventure. Complete tasks to deal damage to bosses, earn XP, level up, and progress through story-driven productivity quests.

## Features

- **Boss Battles**: Fight procrastination monsters by completing tasks
- **XP & Leveling**: Gain experience points and level up your productivity hero
- **Story Progression**: Follow narrative-driven productivity journeys
- **Streak Tracking**: Build momentum with consecutive task completions
- **Damage Modifiers**: Bonus damage for tasks with specific tags (e.g., "deep-work")
- **Persistent Progress**: Your adventure syncs across devices with Super Productivity

## Installation

1. Download the latest ZIP from [Releases](https://codeberg.org/Nexumia/QuestArc/releases)
2. Open Super Productivity
3. Navigate to Settings → Plugins
4. Click "Upload Plugin"
5. Select the downloaded ZIP file

## Quick Start

1.  **Create a Story Template**:
    - Create a new Project in Super Productivity.
    - **Set the Project Icon**: Choose the **Bow & Arrow** (🏹).
    - **Set the Project Title**: Must start with `📜` (e.g., `📜 Morning Routine`).
    - Add Tasks (Steps) and Subtasks (Requirements).
    - _Tip: Use tags like `[freq:daily]` or `[count:5]` in titles for game logic. See [Syntax Guide](docs/SYNTAX_GUIDE.md) for full list._
2.  **Play**:
    - Click "Start" on your new project to begin the quest.
    - Complete tasks to earn XP and damage bosses (when active).

## How It Works

### Creating Stories (The "Story Manager")

QuestArc uses Super Productivity's native **Projects** as the "Story Editor".

1.  **Preparation**: Set the Project Icon to **Bow** (🏹) to mark it as a QuestArc project.
2.  **Template**: Start the Project Title with **Scroll** (`📜`) to define it as a Template.
    - _Example: `📜 Morning Routine`_
3.  **Instance**: When you "Start" a story, the game creates a playable copy (e.g., `Morning Routine 🧭`).
4.  **Syntax**: Define logic directly in Task Titles (see [Syntax Guide](docs/SYNTAX_GUIDE.md)).
    - `Drink Water [freq:daily]` -> Recurring Habit
    - `⚔️ Dragon [HP:500]` -> Boss Battle

### Game Mechanics

**Boss Battles:**

- Each boss has HP (hit points)
- Completing tasks deals damage based on task duration and tags
- Defeat the boss to earn XP and move to the next story step

**XP & Leveling:**

- Earn XP by completing story steps
- Level up when you accumulate enough XP
- XP requirement increases with each level (Level × 100)

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup instructions and [AGENTS.md](AGENTS.md) for architectural guidelines.

### Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Development mode (UI only)
npm run build        # Build the plugin
npm run package      # Build and create ZIP for distribution
npm run test         # Run tests
npm run typecheck    # TypeScript type checking
```

## Project Structure

```
src/
├── plugin.ts            # Background logic (The Brain)
├── app/App.tsx          # UI (The Face)
├── types/
│   ├── state.ts         # Data models
│   └── messages.ts      # Communication protocol
├── lib/
│   ├── game-logic.ts    # Boss damage & progression
│   └── state-manager.ts # State initialization & migration
└── assets/
    └── stories/         # Story JSON files
```

## Roadmap

**Current Status:** v2.1 - Project Integration Phase

**Upcoming Features:**

- Native Habit Integration (Sync with Super Productivity Habit Tab)
- Co-op Mode (Collaborative boss battles)

## Contributing

We follow a document-first workflow. See [AGENTS.md](AGENTS.md) for contribution guidelines.

## License

MIT

## Support

- Report bugs or feature ideas: [Codeberg Issues](https://codeberg.org/Nexumia/QuestArc/issues)
- Documentation: [Syntax Guide](docs/SYNTAX_GUIDE.md)

---

**Made with** ⚔️ **for productivity heroes everywhere**
