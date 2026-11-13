---
type: Plan
title: Roadmap
description: Goals and exit criteria of QuestArc's milestones on the way to one engine with two hosts (Super Productivity plugin, Pensum); the work items are GitHub issues.
tags: [plan, roadmap, milestones]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# How the plan is tracked

Work items are [issues](https://github.com/nexumia-de/quest-arc/issues),
grouped by [milestones](https://github.com/nexumia-de/quest-arc/milestones);
issues without a milestone are the backlog. This file keeps only the
goals. The architecture and the reasons behind it are in
[architecture](architecture.md); the design rules come from
[psychology](psychology.md). Work on the lowest open milestone first.

Milestones have no dates. Every milestone ends with something that
works and green CI, so a pause never leaves a broken state.

# The journey

The heart of QuestArc 3.0. A **journey** is one habit that grows in
stages, and one thing that is built along the way:

- A stage is one habit step ("put the shoes by the door"), anchored to a
  moment ("after breakfast"), with a condition (e.g. 5 of the last 7
  days). Progress is computed from the tasks, never stored.
- Reaching a station tells the next piece of the story. The next stage
  starts only when the user accepts it; accepting sets up its recurring
  task. Super Productivity's plugin API cannot create repeat configs
  ([facts](super-productivity-facts.md)); how the plugin does this is
  decided in _Rules on paper_.
- Finished journeys stay on a shelf of completed journeys; habits that
  became automatic graduate there.
- The journey screen shows the journey's **build**: one thing that is
  whole at every stage and
  becomes a larger version with the next (stepping stones, then a plank
  bridge, then a stone bridge), with a festive marker that grows while a
  stage is under way ([journey design](journey-design.md#builds-and-ladders-the-valley-42)).

Until 3.2 the journey was drawn as a path with XP, levels and guardians
as an optional game layer; 3.3 removed them and shows the build in every
journey (#110). Exit criteria of finished milestones below still name
them as they were.

The journey, its world, names and pictures are QuestArc's own. Other
habit games show that travelling through a world motivates; QuestArc
borrows that idea, nothing of their content or look.

Both hosts draw the same journey: the plugin with SVG in Super
Productivity's theme, Pensum with GTK in libadwaita's look.

# Foundation

[Milestone](https://github.com/nexumia-de/quest-arc/milestone/1)

**Goal**: a clean start for 3.0 with green checks, and the one technical
risk that could change the architecture tested first.

**Exit criteria**: the repository holds only the 3.0 documents and a new
skeleton (workspace with `packages/engine` and the plugin, built from
Super Productivity's current plugin starter); GitHub Actions build, lint,
typecheck and test every pull request and publish releases from tags;
dependencies pinned with Dependabot; a `LICENSE` file; agent rules for
3.0; the GJS spike decided how Pensum runs the engine; 2.x tags on
GitHub; GoVenture and HeroicRPG archived on Codeberg.

# Rules on paper

[Milestone](https://github.com/nexumia-de/quest-arc/milestone/2)

**Goal**: everything the engine and both hosts must do is written down
and approved by the owner, starting with the open risks.

**Exit criteria**: [Super Productivity facts](super-productivity-facts.md)
complete for the current release; decision on setting up recurring
tasks from the plugin, with a request to Super Productivity for an API
sent through the owner; rules for missed days (repeat schedules) and for
deleted history; `docs/game-rules.md`, `docs/story-format.md` with a
schema, `docs/data-model.md`, `docs/behaviour.md` and the journey
mockups approved.

# Engine

[Milestone](https://github.com/nexumia-de/quest-arc/milestone/3)

**Goal**: one pure TypeScript engine computes what the first journey
needs from task data, the same in Node and in GNOME's JavaScript runtime.

**Exit criteria**: logical days, XP and level, stage conditions with
never miss twice, journey position and guardians, events for toasts,
journey validation; shared test vectors pass in Node and in `gjs`; the
engine archive for Pensum is built in CI.

# First journey in Super Productivity

[Milestone](https://github.com/nexumia-de/quest-arc/milestone/4)

**Goal**: the owner walks a real journey every day in Super Productivity
with QuestArc 3.0.

**Exit criteria**: plugin adapter on the engine; one built-in journey;
starting a journey (own "why", self-chosen start date) and accepting
stages; journey view, level in the header, toasts, calm and RPG mode,
shelf; weekly look back with the automaticity question; welcome back
after a miss; fallback to the previous stage and pause; learning nuggets
at stations; the page "How QuestArc motivates you"; a test inside a running Super
Productivity; QuestArc never writes into titles, notes or project names;
release 3.0.0; the owner uses it every day without workarounds.

# Journey in Pensum

[Milestone](https://github.com/nexumia-de/quest-arc/milestone/5)

**Goal**: the same journey on the phone, native in Pensum.

**Exit criteria**: tracked in Pensum's repository (nexumia-de/pensum#38,
#39, #40), started after Pensum's M2 (repeating tasks). Read-only first:
journey page with the build, toasts; then
accepting a stage on the phone with the same choice records.

# Habits that last

Milestone to be created by the owner.

**Goal**: QuestArc fits the person, not only the count, and lets go of a
habit that runs by itself.

**Exit criteria**, in this order: staying at a stage and skipping one
(#81); the card after a long break with a real step back (#82); the rules
for graduation and anchors agreed on paper together, because anchors say
what happens to a graduated step (#22, #96); graduation by automaticity
in the engine and the plugin (#22); anchors as the home of QuestArc, with
only the growing step ticked (#96); the run of maintained habits on the
shelf (#66); the reminder suggestion that fades (#60); the script for the
owner's look back after eight weeks of daily use, written first so the
weeks have something to show (#84).

# More journeys

[Milestone](https://github.com/nexumia-de/quest-arc/milestone/6)

**Goal**: more to walk, in two languages.

**Exit criteria**: the built-in journeys the owner chose (#37); German
texts (#39); "pair it with" (#58); the optional plan check (#59). Done
already: others can publish journeys by pull request, with self-contained
journey files, the journey checker in CI and a guide for people and
their agents ([decision](decisions/journeys-by-pull-request.md)).

# The Valley

Milestone to be created by the owner.

**Goal**: what was built stays visible beyond one journey. There is one
look; nothing here is an optional layer.

**Exit criteria**: a region per anchor with the Map, the place after the
journey (it stays alive with the maintained habit and gets its lit
lantern at graduation) and the remaining ladders (#114); the principles
every display follows (#88). Keepsakes (#87) and the travel companion
(#43) belong here only if the owner decides for them after the look
back (#84).

# Private journeys

Milestone to be created by the owner.

**Goal**: users keep journeys of their own without publishing them.

**Exit criteria**: import and export of a journey file in the plugin and
in Pensum, checked by the same journey checker as CI (#40); the quick
journey form, later the editor (#89).

# Standalone app

Milestone to be created by the owner, after the spike.

**Goal**: QuestArc for people without Super Productivity, on the same
data format.

**Exit criteria**: the spike answers whether the plugin's screens run on
a local store with little new code (#93); then the owner decides the
open points of the plan (#91).

# Backlog

Issues without a milestone: the plugin API for repeat configs, waiting
for upstream (#41); focus sessions as a stage condition (#44);
cooperation if it works without a server (#45); QuestArc's settings from
Super Productivity's plugin settings (#67); the plugin API types from
npm (#109). The standing rule for one build on Super Productivity 19.3
and later is #102.
