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
  ([facts](super-productivity-facts.md)); how the plugin does this is
  decided in _Rules on paper_.
- Finished journeys stay on a shelf of completed journeys; habits that
  became automatic graduate there.

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
journey page, level, toasts, game layer switch in preferences; then
accepting a stage on the phone with the same choice records.

# More journeys

[Milestone](https://github.com/nexumia-de/quest-arc/milestone/6)

**Goal**: more journeys and the parts of the game that only matter after
a while.

**Exit criteria**: more built-in journeys written along the psychology
rules; HP in RPG mode; graduation by automaticity; "pair it with";
optional plan check (WOOP); reminders that fade; German texts; others
can publish journeys by pull request: self-contained journey files, the
journey checker in CI and a guide for people and their agents
([decision](decisions/journeys-by-pull-request.md)).

# Private journeys

**Goal**: users keep journeys of their own without publishing them.

**Exit criteria**: import and export of a journey file in the plugin and
in Pensum, checked by the same journey checker as CI (#40). Milestone to
be created by the owner.

# Backlog

Issues without a milestone: a world map that links journeys into
regions; companions that reflect the consistency of one area; focus
sessions as a stage condition; cooperation if it works without a server.
