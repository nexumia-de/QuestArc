---
type: Decision Record
title: The plugin's view uses no UI framework
description: The plugin's screens are plain TypeScript that builds DOM elements with a small helper and redraws a screen from the game state; no third-party code ships in the plugin.
tags: [decision, plugin, ui]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# The plugin's view uses no UI framework

Issue #30, decided by best practice as the owner asked for this
milestone. Issue #47 asked to record the choice.

## Problem

The plugin's view runs in an iframe inside Super Productivity and needs
about ten simple screens ([behaviour](../behaviour.md)) and one drawing
(the journey, SVG). QuestArc 2.x used SolidJS; Super Productivity's
plugin starter uses plain JavaScript without a build step
([facts](../super-productivity-facts.md) §1).

## Options

1. A small framework (Preact, Lit, SolidJS).
2. Plain TypeScript: a helper `h(tag, attributes, …children)` builds
   elements; each screen is a function from the game state to elements;
   the shell redraws the current screen when the state changes.

## Decision

Option 2.

## Why

- The screens hold almost no state of their own: they show the engine's
  game view and write choice records. Redrawing a screen from the state is
  enough; a framework's reactivity would add little.
- Nothing third-party ships in the plugin, so there are no licence texts
  to bundle, no framework updates to follow and the view stays small
  (limit 100 KB in Super Productivity 19.3.x, 1 MB later; the build
  fails above 100 KB).
- It follows Super Productivity's own plugin starter and keeps the
  journey drawing (hand-made SVG) in the same style as the rest.
- The UI code is not shared with Pensum (GTK), so a framework would not
  be reused there.

## Consequences

- Redrawing a screen replaces its elements: the shell keeps the scroll
  position, and screens that hold input (the reason text field, #52)
  must keep their value outside the redraw or redraw only on navigation.
- If screens grow complex state later (forms with validation, animations),
  this decision is revisited; a switch would be local to `packages/plugin/src/ui`.
