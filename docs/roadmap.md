---
type: Plan
title: Roadmap
description: Goals and exit criteria of QuestArc's milestones on the way to one engine with two hosts (Super Productivity plugin, Pensum); the work items are GitHub issues.
tags: [plan, roadmap, milestones]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# How the plan is tracked

Work items are [issues](https://github.com/nexumia-de/QuestArc/issues),
grouped by [milestones](https://github.com/nexumia-de/QuestArc/milestones);
issues without a milestone are the backlog. This file keeps only the
goals. The architecture and the reasons behind it are in
[plan 111](111/plan.md); the design rules come from
[psychology](psychology.md). Work on the lowest open milestone first.

Milestones have no dates. Every milestone ends with something that
works and green CI, so a pause never leaves a broken state.

# The journey

The heart of QuestArc 3.0. A **journey** is a story drawn as a path:

- The path runs from the bottom of the screen upwards, one **stage** per
  station. It scrolls vertically, so it fits a 360 px phone.
- A stage is one habit step ("put the shoes by the door"), anchored to a
  moment ("after breakfast"). Its condition (e.g. 5 of the last 7 days)
  fills the path segment to the next station.
- The hero marker stands where the user's progress is; the position is
  computed from the tasks, never stored.
- At the end of some stretches waits a **guardian** (boss). Work on the
  journey's tasks wears it down.
- Reaching a station tells the next piece of the story. The next stage
  starts only when the user accepts it; accepting sets up its recurring
  task. Super Productivity's plugin API cannot create repeat configs
  today (`PluginCreateTaskData` has no repeat field, the repeat actions
  are not in `ALLOWED_PLUGIN_ACTIONS`); how the plugin does this is an
  open decision in M1.
- Finished journeys stay on a shelf of completed journeys; habits that
  became automatic graduate there.

The journey, its world, names and pictures are QuestArc's own. Other
habit games show that travelling through a world motivates; QuestArc
borrows that idea, nothing of their content or look.

Both hosts draw the same journey: the plugin with SVG in Super
Productivity's theme, Pensum with GTK in libadwaita's look.

# M0 – Foundation

**Goal**: QuestArc lives on GitHub and its checks are green, before
anything is rebuilt.

**Exit criteria**: GitHub Actions run build, lint, typecheck and tests on
every pull request and publish the plugin ZIP for tags; the existing
tests pass and `tsc` is clean; README and manifest point to GitHub;
tags `v1.0.0`…`2.2.0` are on GitHub; GoVenture and HeroicRPG are archived
on Codeberg with a note pointing here.

# M1 – Rules on paper

**Goal**: everything the engine and both hosts must do is written down
and approved by the owner.

**Exit criteria**: `docs/game-rules.md` (XP, level, stage conditions,
never miss twice, guardians, optional HP, graduation, worked examples);
`docs/data-model.md` (snapshot input, choice records with one plugin-data
key each, story format 3); `docs/behaviour.md` (screens incl. the
journey, flows, texts, actions, and where each lands in Super
Productivity and in Pensum); Super Productivity facts verified in its
source (archived tasks, repeat configs, day start).

# M2 – Engine

**Goal**: one pure TypeScript engine computes the whole game from task
data, the same in Super Productivity and in GNOME's JavaScript runtime.

**Exit criteria**: a spike proved the engine runs in `gjs` from the GNOME
51 runtime fast enough on the phone (or the fallback is decided);
`packages/engine` computes level, journey position, stage conditions,
guardians and graduation; shared test vectors pass in Node and in `gjs`;
`engine.mjs` and its command-line wrapper are built in CI.

# M3 – First journey in Super Productivity (QuestArc 3.0)

**Goal**: the owner walks a real journey every day in Super
Productivity.

**Exit criteria**: clean break from 2.x (old quest projects are left as
they are, with a one-time import of a running story); one built-in
journey; accepting a stage creates its recurring task; journey view,
level in the header, toasts after completing tasks, calm and RPG mode;
QuestArc no longer writes into titles, notes or project names; release
3.0.0 on GitHub; the owner uses it every day without falling back
to 2.x or to workarounds.

# M4 – Journey in Pensum

**Goal**: the same journey on the phone, native in Pensum.

**Exit criteria**: tracked in Pensum's repository as its own milestone,
started after Pensum's M2 (repeating tasks). Read-only first: journey
page, level, toasts, game layer switch in preferences; then accepting a
stage on the phone with the same choice records.

# M5 – More journeys

**Goal**: enough journeys for a few months, and the parts of the game
that need time to matter.

**Exit criteria**: three to five built-in journeys written along the
psychology rules; shelf of finished journeys and graduated habits; HP in
RPG mode; German texts; import and export of journeys as JSON so users
can write and share their own.

# Later (backlog)

A world map that links journeys into regions; companions that reflect
the consistency of one area; focus sessions as a stage condition (time
spent is already in the data); cooperation if it works without a server.
