---
type: Concept
title: Journey design
description: How the journey is drawn in both hosts: a vertical path of stations with clear states, a progress segment, a calm and a game variant of the same layout, and the rules for colours, shapes and accessibility; with mockups.
tags: [design, ui, journey, mockups]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
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
