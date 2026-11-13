---
type: Concept
title: Plugin adapter
description: How the Super Productivity plugin keeps the game current: plugin.js reads the data, runs the engine, caches what is expensive, shows a message after each change and answers the view's requests; which hooks it uses and the fallbacks for older Super Productivity versions.
tags: [plugin, adapter, hooks, super-productivity]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Plugin adapter

Issue #28. The plugin has two parts
([facts](super-productivity-facts.md) §1):

- **plugin.js** runs inside Super Productivity as long as the plugin is
  enabled. It holds the game: it reads the data, runs the engine, keeps
  the last game view and shows a message (snack) after a change, whether
  the QuestArc page is open or not.
- **The view** (`index.html`, an iframe) only draws. It asks plugin.js
  for the state and sends the choices the user makes back to it.

Code: `packages/plugin/src/adapter/` (one file per job),
`src/shared/protocol.ts` (the messages), `src/plugin.ts` (wiring).

## Evaluating

1. Read the choice records (`listSyncedDataKeys`, `loadSyncedData`), the
   live tasks and repeat configs (`getAppState`), the archive
   (`getArchivedTasks`) and the logical day (`getDayContext`).
2. Keep only the bound tasks and repeat configs
   ([data model](data-model.md) §1: hosts may filter).
3. Run the engine; compare with the last view (`diff`); turn the events
   into one message ([behaviour](behaviour.md), flow A). The first
   evaluation after start is the baseline and shows nothing.

Evaluations run one at a time. Refresh requests are coalesced: the first
starts a 750 ms timer, later ones join it, so at most one evaluation runs
per 750 ms even while time tracking fires `dataChanged` every second. A
request from the view runs a waiting evaluation at once.

When Super Productivity switches the plugin off, reloads or replaces it,
`plugin.js` stops the brain in `PluginAPI.onUnload` (feature-detected):
the waiting timer is cleared, later refreshes are ignored and a running
evaluation shows no message. Without it the old instance's timer would
fire once more beside the new one
([facts](super-productivity-facts.md), consequences).

## Caching

| Data           | Read again when                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Choice records | `persistedDataChanged` (own writes, sync, import); own writes are merged at once                                              |
| Archive        | the logical day changes, the daily summary runs (`finishDay`), the window regains focus, or a bound task leaves the live list |
| Live tasks     | every evaluation                                                                                                              |

A bound task that leaves the live list was archived (or deleted); reading
the archive again keeps its completion. Large archives are therefore read
only a few times a day.

## Hooks and older versions

| Hook                                                        | Invalidates | Since                                 |
| ----------------------------------------------------------- | ----------- | ------------------------------------- |
| `dataChanged`                                               | tasks       | since 20.0.0; also covers remote sync |
| `dayChange`                                                 | archive     | since 20.0.0                          |
| `persistedDataChanged`                                      | records     | 19.3.0                                |
| `finishDay`                                                 | archive     | 19.3.0                                |
| `taskComplete`, `taskUpdate`, `taskDelete`, `anyTaskUpdate` | tasks       | 19.3.0; local changes only            |
| window focus regained                                       | archive     | 19.3.0                                |

Each hook is registered on its own: older versions reject unknown hooks.
On 19.3.0 and 19.3.1, task changes from another device reach QuestArc when
the user comes back to the window. Without `getDayContext` the local date
and a day start of midnight are used.

## The view

The view sends `PLUGIN_MESSAGE` with `questarc:get` or `questarc:write`
(records to write; `''` withdraws one) and gets the state back: a
`revision` number, the game view, the journeys and the raw records. It
asks again 300 ms after a hook fires in the view (so plugin.js has marked
its data stale first), when the page becomes visible, and every 5 s as a
fallback; it redraws only when the revision changed.

## Task context menu

"Use for current QuestArc station" (Super Productivity 19.2.0 and newer)
binds the chosen task to the active journey's current stage
(`adapter/context-menu.ts`). A task that does not repeat yet is bound too;
the stage waits until the user sets its repeat.

## Paused repeats

When the active stage's bound repeat config changes between paused and
not paused in Super Productivity, plugin.js writes a `pause` or `resume`
record with `source: "repeat-cfg"` for that day
([game rules](game-rules.md) §2, `adapter/repeat-pause.ts`). The first
evaluation after start only remembers the state. Devices that see the
same change write the same record.

## Not yet

- The level in the header button (#32): `registerHeaderButton` cannot
  update a label ([facts](super-productivity-facts.md) §7).
