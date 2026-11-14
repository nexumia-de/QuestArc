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
- [Journey design](journey-design.md) - The build above the station card, last seven days, accessibility, builds and ladders of the Valley (versions, markers that grow element by element, way points, a hue per region), the journey screen with the build in game mode, the older scene rules for a region; mockups.
- [Data model](data-model.md) - Engine input (snapshot), choice records as one plugin-data key each, the game view and events, what Pensum reads and writes.
- [Journey: A gentle morning](journey-gentle-morning.md) - The first built-in journey: from one glass of water to a short morning routine, four stages; how it follows the design rules.
- [Journey: First Things First](journey-first-things-first.md) - The second built-in journey, for work: one task written down, 15 then 45 quiet minutes on it, email in blocks, a one-line look back.
- [Journey: Evening wind-down](journey-evening-wind-down.md) - Built-in journey: after brushing teeth, from the phone on its charger to a short calm routine and a steady time for lights out; what the sleep evidence allows.
- [Journey: Tidy a little](journey-tidy-a-little.md) - Built-in journey: after dinner, from one thing put back to five minutes for the table, the counter and one more spot.
- [Journey: A walk after lunch](journey-walk-after-lunch.md) - Built-in journey for movement: from stepping outside the door to a 20-minute walk in four stages.
- [Journey: A few pages before sleep](journey-pages-before-sleep.md) - Built-in journey for reading: after getting into bed, from one page to 20 minutes of reading in four stages.
- [Story format 3](story-format.md) - Journeys as one self-contained JSON file: stages with plan, schedule, condition, story texts and nugget; own texts and author; the journey checker; versions.
- [Writing a journey](authoring-journeys.md) - Guide for people and their agents: the rules in short, the file, a template, the check, publishing by pull request, the CC BY-SA licence.
- [Game rules](game-rules.md) - Exact rules and numbers: what counts, due days, never miss twice, stage conditions, welcome back, graduation, the build of a journey (ladder, version, marker progress, ready), with worked examples.

- [Habit app psychology evidence](research.md) - Evidence review with strength ratings: what to use, add or avoid; quotes and learning nuggets; focused work; changes to the design rules; open gaps.
- [Design rules from habit psychology](psychology.md) - 28 binding rules for the habit, progress, missed days, game layer, learning nuggets, reminders, graduation and privacy, each backed by the evidence review.

# Super Productivity

- [Super Productivity facts](super-productivity-facts.md) - Plugin API, plugin data, task and repeat data, UI integration and what a plugin may show outside its page, verified at a recorded upstream commit.

# Development

- [Plugin adapter](plugin-adapter.md) - plugin.js keeps the game current: evaluation, caching, hooks with fallbacks for older Super Productivity, messages, and the protocol with the view.
- [Development](development.md) - Layout, commands, plugin build and packing, plugin API types copy, running the engine in gjs, cloud environment hosts.
- [Dependencies](dependencies.md) - Every dependency with version, licence and use; nothing third-party ships in the plugin.

# Decision records

- [Pensum runs the engine in gjs](decisions/engine-in-gjs.md) - gjs 1.90.1 in GNOME 51 runs the engine; 50,000 tasks in about 130 ms on x86; phone measurement open.
- [How the plugin sets up a stage's recurring task](decisions/recurring-task-setup.md) - Create and hand over, or bind an existing task; upstream API requested in parallel.
- [The plugin's view uses no UI framework](decisions/plugin-ui-without-framework.md) - Plain TypeScript with a small DOM helper; screens are redrawn from the game state; nothing third-party ships.
- [Finished stages survive deleted history](decisions/deleted-history.md) - Checkpoint record per accepted stage; only open progress is derived.
- [Marker progress is derived as the best day of the stage](decisions/marker-progress.md) - The build's marker follows the stage's highest condition progress, recomputed from the task history in one pass; nothing stored; finished stages stay with the checkpoints.
- [One set of symbolic pictures for both hosts](decisions/shared-pictures.md) - Go: symbolic SVG in `content/art/` with six colour roles (fg, accent, dim, bg, tint, tint-strong), filled from each host's theme; scenes in three depth bands; checked by the picture and scene checkers; screenshots of both hosts and the review rounds of #97.
- [One plugin build for older Super Productivity versions](decisions/one-build-for-older-versions.md) - `minSupVersion` stays 19.3.0; one ZIP within 19.3.x's limits (index.html ≤ 100 KB), larger content via `plugin.js`, newer API members feature-detected.
- [A data format number on the record that needs it](decisions/data-format.md) - Hosts on different engine versions: `dataFormat` on the run-scoped record an older engine would misread makes that run read-only there; unknown kinds and fields are ignored and kept; `guardWrite` refuses writes into such runs.
- [Others publish journeys by pull request](decisions/journeys-by-pull-request.md) - One self-contained file, checked in CI, merged by the owner; CC BY-SA 4.0 with "Written by …"; private journeys later with the same file.
- [The standalone app is a third host in this repository](decisions/standalone-app.md) - `packages/app` next to the plugin, screens and adapter core in one shared `packages/ui`; PWA then APK, no Flatpak; released on its own tags.
- [Spike: the screens and the engine as a standalone web app](decisions/standalone-app-spike.md) - Go: screens, adapter and engine run unchanged as an offline web app on a dataset in Super Productivity's backup format; what a shared package and the host interface need first.
