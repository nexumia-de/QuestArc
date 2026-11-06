---
okf_version: '0.2'
---

# QuestArc knowledge bundle

[Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
(OKF v0.2) bundle. One file per concept, YAML frontmatter, plain markdown
links. Change history is in [log.md](log.md).

# Plan

- [Roadmap](roadmap.md) - The journey and the goals and exit criteria of each milestone; work items are GitHub issues.
- [Architecture](architecture.md) - One pure engine, two native hosts, derived game state, stored choices; prototypes, risks and the owner's decisions.

# Design

- [Behaviour](behaviour.md) - Every screen, flow and text, host-neutral, and where each lands in Super Productivity and Pensum.
- [Journey design](journey-design.md) - The path, station states, last seven days, calm and game variant, accessibility; mockups.
- [Data model](data-model.md) - Engine input (snapshot), choice records as one plugin-data key each, the game view and events, what Pensum reads and writes.
- [Journey: A gentle morning](journey-gentle-morning.md) - The first built-in journey: from one glass of water to a short morning routine, four stages, two guardians; how it follows the design rules.
- [Story format 3](story-format.md) - Journeys as JSON: stages with plan, schedule, condition, guardian, story texts and nugget; text keys; schema check; versions.
- [Game rules](game-rules.md) - Exact rules and numbers: what counts, due days, never miss twice, stage conditions, XP and welcome back, level, guardians, HP, graduation, calm mode, with worked examples.

- [Habit app psychology evidence](research.md) - Evidence review with strength ratings: what to use, add or avoid; quotes and learning nuggets; changes to the design rules; open gaps.
- [Design rules from habit psychology](psychology.md) - 27 binding rules for the habit, progress, missed days, game layer, learning nuggets, reminders, graduation and privacy, each backed by the evidence review.

# Super Productivity

- [Super Productivity facts](super-productivity-facts.md) - Plugin API, plugin data, task and repeat data, UI integration, verified at a recorded upstream commit.

# Development

- [Plugin adapter](plugin-adapter.md) - plugin.js keeps the game current: evaluation, caching, hooks with fallbacks for older Super Productivity, messages, and the protocol with the view.
- [Development](development.md) - Layout, commands, plugin build and packing, plugin API types copy, running the engine in gjs, cloud environment hosts.
- [Dependencies](dependencies.md) - Every dependency with version, licence and use; nothing third-party ships in the plugin.

# Decision records

- [Pensum runs the engine in gjs](decisions/engine-in-gjs.md) - gjs 1.90.1 in GNOME 51 runs the engine; 50,000 tasks in about 130 ms on x86; phone measurement open.
- [How the plugin sets up a stage's recurring task](decisions/recurring-task-setup.md) - Create and hand over, or bind an existing task; upstream API requested in parallel.
- [The plugin's view uses no UI framework](decisions/plugin-ui-without-framework.md) - Plain TypeScript with a small DOM helper; screens are redrawn from the game state; nothing third-party ships.
- [Finished stages survive deleted history](decisions/deleted-history.md) - Checkpoint record per accepted stage; only open progress is derived.
