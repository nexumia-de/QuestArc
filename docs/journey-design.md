---
type: Concept
title: Journey design
description: How the journey is drawn in both hosts: a vertical path of stations with clear states, a progress segment, a calm and a game variant of the same layout, the rules for colours, shapes and accessibility, and the scene rules for a region of the Valley; with mockups.
tags: [design, ui, journey, mockups, pictures, valley]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
sources:
  - '[^97]: https://github.com/nexumia-de/QuestArc/issues/97'
  - '[^42]: https://github.com/nexumia-de/QuestArc/issues/42'
  - '[^96]: https://github.com/nexumia-de/QuestArc/issues/96'
---

# Journey design

Decided on 2026-11-05 (#15) by best practice, as the owner asked: one
layout with a calm and a game variant, drawn from simple shapes in the
host's own colours. The screens around it are in [behaviour](behaviour.md).

## Mockups

| Phone, calm                                    | Phone, with game                                   |
| ---------------------------------------------- | -------------------------------------------------- |
| ![Phone, calm](mockups/journey-phone-calm.svg) | ![Phone, with game](mockups/journey-phone-rpg.svg) |

![Desktop, calm](mockups/journey-desktop.svg)

[valley-sketch.svg](mockups/valley-sketch.svg) is a rough sketch for the
world (#42): the journey as its region and the regions as a map. It is
a sketch, not a decision; the pictures it hints at are now drawn as
symbolic files ([shared pictures](decisions/shared-pictures.md)).

The mockups use neutral placeholder colours (blue accent on light grey).
In the plugin the colours come from Super Productivity's theme variables,
in Pensum from libadwaita's accent and named colours, both in light and
dark style.

## Layout

- **Phone (360 px):** the path fills the upper part and scrolls
  vertically; the current station's card sits at the bottom with the
  plan, the condition and the last seven due days. The path opens
  scrolled so that the current station is in view.
- **Desktop and wide windows:** the path on the left, the current or
  selected station's details on the right (plan, reason, condition, last
  days, learning nugget, arrival story).
- The path runs from the bottom (start) to the top (goal), so going up
  means getting further. Finished stations scroll out below.

## Path and stations

| Element          | Shape                                                                  | Text next to it            |
| ---------------- | ---------------------------------------------------------------------- | -------------------------- |
| finished station | filled circle with a check mark                                        | short name, "Done · date"  |
| current station  | large ring; calm: a dot inside, game: a pennant (the hero)             | "You are here", short name |
| met station      | large ring with a check mark ring, button "Continue" in the card       | "Ready to continue"        |
| station ahead    | small hollow circle                                                    | short name                 |
| unbound station  | hollow circle with a small plus                                        | "Set up the task"          |
| goal             | pennant at the end of the path                                         | the ending in a few words  |
| path behind      | solid line in the accent colour                                        | —                          |
| current segment  | light line, filled in the accent colour up to the condition's progress | —                          |
| path ahead       | dotted grey line                                                       | —                          |
| guardian (game)  | diamond on the segment it guards, with name and HP bar                 | name, "HP / max"           |

- The path is a gentle S-curve with fixed geometry per station count;
  no map, no landscape art, no characters. This keeps it drawable with
  SVG in the plugin and with GTK drawing in Pensum, and it stays QuestArc's
  own look.
- The hero is a pennant, not a figure: no avatar to customise, nothing
  to collect.

## Last seven due days

A row of marks in the card, oldest left; the engine reports them as
`lastDays` of the current station ([data model](data-model.md) §3):

| Day        | Mark                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- |
| done       | filled circle                                                                          |
| gap (miss) | hollow grey circle with a dash                                                         |
| open       | dashed ring (today, or yesterday not yet ticked off: still inside the backfill window) |
| not due    | not shown (only due days are listed)                                                   |
| paused     | two short bars                                                                         |

Weekday letters below each mark. A gap is grey, never red, and no count
falls to zero; the run text ("Run 4 · best 6") stays next to the marks.

## Calm and game

Same layout. The game variant adds: level chip and HP (heart with a
number) in the header, the pennant as hero, guardians on the path and XP
earned on finished stations. XP is never shown before it is earned.

## Accessibility

- Every state has a shape and a text, not only a colour.
- Touch targets of stations at least 44 × 44 px, even when the drawn
  circle is smaller.
- Texts follow the system font size; the card grows, the path scrolls.
- Screen readers get the stations as a list in path order with their
  state ("Station 2 of 3, current: walk for 5 minutes, 4 of 5 days").

## Scenes of a region (for the Valley, #42)

Art direction from #97[^97], for the Valley (#42)[^42] to build on: a
region is drawn as a place, not a row of icons. A scene is a file
`content/art/<name>.scene.json` (format and checker in
[shared pictures](decisions/shared-pictures.md)); the hosts only place
what it says. The examples are a meadow at three moments
(`meadow-started`, `meadow-half`, `meadow-finished`) and a shore
(`shore-finished`):

| Light                                                              | Dark                                                           |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| ![A meadow at three moments](screenshots/valley-moments-light.png) | ![The same in dark style](screenshots/valley-moments-dark.png) |

![A shore, both hosts, light and dark](screenshots/valley-shore.png)

**Look.** Calm and light, like the [sketch](mockups/valley-sketch.svg):
built things (landmarks, keeper, lantern, pennant, boat) are outlined in
`fg` and filled with `bg`, with at most one `accent` detail (a window, the
bucket, the light, the flag); nothing built is solid. Growth (tufts,
flowers, bushes, trees, reeds) is solid `tint-strong`, with `accent` only
for blossoms. The hedgehog is outlined like a built thing. Ground and
distance use `tint` and `tint-strong` only; the sky is the card itself.

**Size.** Every scene is 320 × 120 units, about 1 px per unit in a card
at 360 px.

**Sky.** At most the top fifth (24 units) is empty sky; hills or a
horizon start there. Only far silhouettes and the tops of tall things
reach into it.

**Three depth bands**, each with fixed sizes (a picture is square; its
feet are on y = 30 of its 32 grid, so feet = y + 15/16 of its size):

| Band   | Feet between | Large (house, tree, lighthouse) | Medium (well, bench, gate, bush, pennant, lantern, boat, reeds) | Small (stone, tuft, flowers, hedgehog) | Drawn as                 |
| ------ | ------------ | ------------------------------- | --------------------------------------------------------------- | -------------------------------------- | ------------------------ |
| far    | 24–52        | 20                              | 12                                                              | –                                      | one silhouette in `tint` |
| middle | 52–92        | 34                              | 24                                                              | 14                                     | own roles                |
| near   | 92–120       | 48                              | 34                                                              | 20                                     | own roles                |

The far band holds only scenery and growth that has become large
(trees, later groves): it merges with the ground into one light
silhouette, so it never competes with what was built. Pictures are
listed back to front (feet never move up), so nearer things cover
farther ones.

**Ground.** A ground file (`ground-<kind>`) carries the kind's layers in
`tint` (the field, far hills) and `tint-strong` (near banks in the
corners, water), and the **path**: one ribbon in `bg` from the bottom
edge to the goal, wide near the viewer (about 20 units) and narrow at
the goal (about 5). The path's geometry is the ground's; everything else
stands beside it.

**Where things stand.**

- The **path** is paved with stones (`stone`, small, on the ribbon) as
  the journey is walked: the first stone at the bottom edge when it
  starts, then one stone per reached place, never ahead of the user.
  Ahead the ribbon is bare.
- **Landmarks** (one per station) stand beside the path at its station,
  alternating sides, the first in the near band, later ones in the
  middle band as the path climbs.
- The **keeper** (a worn-down guardian, the open gate) stands on its
  segment of the path, the path running through it.
- The **goal** is the path's far end in the middle band: the **pennant**
  stands there from the start; the **lit lantern** joins it beside the
  pennant when the step graduates. With anchors (#96)[^96] a region holds
  several steps; each graduated step's lantern stands by its landmark.
- **Growth** (one small thing per completion, #42) takes the next free
  place of a fixed row of places off the path: tufts and flowers small,
  in the middle and near bands; ten become one larger thing (bush, then
  tree) in the same band; the largest grow in the near corners (framing
  the scene on the near banks) and on the horizon (far band).
- A **companion** (the hedgehog) walks on the path in the near band.

**Kinds differ at a glance** by their ground's shape and their own
pictures: a meadow is rolling hills with trees; a shore is a flat
horizon over water in `tint-strong` with `bg` waves, a beach, a boat and
a lighthouse, reeds instead of trees.

**Smallest sizes.** Every single picture must read at 24, 32 and 48 px
on a card ([size strip](screenshots/valley-sizes.png), light plugin left,
dark Day Planner right); in a scene a landmark is never drawn smaller
than 24 units (the medium middle size), growth and the hedgehog never
smaller than 14 (12 for far silhouettes, which need not read on their
own). The Map, which shows regions smaller, must keep a region at least
240 px wide or drop the small band.

**Review rounds** for #97 (plugin left, Day Planner right, light then
dark, at 360 × 720, scale 1): [round 0, the spike](screenshots/valley-round-0.png),
[1: tint roles, solid grey growth, stones without a path](screenshots/valley-round-1.png),
[2: path ribbon, growth in `tint-strong`, outlined landmarks](screenshots/valley-round-2.png),
[3: landmarks along the path, hedgehog outlined](screenshots/valley-round-3.png),
[4: no rim lines between layers](screenshots/valley-round-4.png),
[5: near banks for a near layer](screenshots/valley-round-5.png).
