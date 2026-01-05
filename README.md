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

1. After installation, click the QuestArc button in the Super Productivity header
2. Start completing tasks to damage the boss and earn XP
3. Tag tasks with "deep-work" for 2x damage multiplier
4. Complete story steps to progress through the adventure

## How It Works

### The Split-Brain Architecture

QuestArc uses a "Split-Brain" design to work seamlessly on mobile and desktop:

- **The Brain** (`plugin.ts`): Runs in the main app, handles all game logic, tracks state, and persists data
- **The Face** (`App.tsx`): The SolidJS UI that displays your progress and polls for updates every 2 seconds

This ensures your progress is tracked even when the plugin UI is closed.

### Game Mechanics

**Boss Battles:**
- Each boss has HP (hit points)
- Completing tasks deals damage based on task duration and tags
- Defeat the boss to earn XP and move to the next story step

**XP & Leveling:**
- Earn XP by completing story steps
- Level up when you accumulate enough XP
- XP requirement increases with each level (Level × 100)

**Story Steps:**
- **Streak Steps**: Complete N tasks in a row
- **Boss Steps**: Deal enough damage to defeat the boss

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

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full development roadmap.

**Current Status:** Phase 1 - Core Engine (MVP 1)

**Upcoming Features:**
- Story Editor (create custom quests)
- Template Library (pre-built productivity journeys)
- Import/Export (share stories)
- Co-op Mode (collaborative boss battles)

## Contributing

We follow a document-first workflow. See [AGENTS.md](AGENTS.md) for contribution guidelines.

## License

MIT

## Support

- Report bugs or new feature ideas: [GitHub Issues](https://codeberg.org/Nexumia/QuestArc/issues)
- Super Productivity: [super-productivity.com](https://super-productivity.com)

---

**Made with** ⚔️ **for productivity heroes everywhere**
