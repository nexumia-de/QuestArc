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

- [Habit app psychology evidence](research.md) - Evidence review with strength ratings: what to use, add or avoid; quotes and learning nuggets; changes to the design rules; open gaps.
- [Design rules from habit psychology](psychology.md) - 27 binding rules for the habit, progress, missed days, game layer, learning nuggets, reminders, graduation and privacy, each backed by the evidence review.

# Super Productivity

- [Super Productivity facts](super-productivity-facts.md) - Plugin API, plugin data, task and repeat data, UI integration, verified at a recorded upstream commit.

# Development

- [Development](development.md) - Layout, commands, plugin build and packing, plugin API types copy, running the engine in gjs, cloud environment hosts.
- [Dependencies](dependencies.md) - Every dependency with version, licence and use; nothing third-party ships in the plugin.

# Decision records

- [Pensum runs the engine in gjs](decisions/engine-in-gjs.md) - gjs 1.90.1 in GNOME 51 runs the engine; 50,000 tasks in about 130 ms on x86; phone measurement open.
