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

### What the view carries, and what plugin.js sends

Super Productivity 19.3 installs an `index.html` of at most 102,400 bytes
([decision](decisions/one-build-for-older-versions.md)), so `index.html`
holds the view's code and its start state only; data travels in
`plugin.js`:

| What                                                       | Where it is                                 | How it reaches the view            |
| ---------------------------------------------------------- | ------------------------------------------- | ---------------------------------- |
| The screens' code                                          | `index.html`                                | –                                  |
| The page and the first message (`src/ui/start.css`)        | `index.html`                                | –                                  |
| The four texts of the start state (`ui.error.starting`, …) | `index.html`, taken from `en.json` at build | –                                  |
| All UI and event texts (`content/i18n/en.json`)            | `plugin.js` (`shared/english.ts`)           | once, `questarc:content` → `texts` |
| The style of the screens (`src/ui/style.css`)              | `plugin.js` (`virtual:questarc-style`)      | once, `questarc:content` → `style` |
| The ladders' pictures, ladders, palette and markers (#100) | `plugin.js` (`adapter/art-pack.ts`)         | once, `questarc:content` → `art`   |
| The journeys and their texts                               | `plugin.js` (`shared/content.ts`)           | with every state (`journeys`)      |

The view's first request is `questarc:content` (`adapter/content-pack.ts`
answers it, `ui/content.ts` takes it in: texts into `shared/texts.ts`,
one `<style>` element after the inlined one, the pictures into
`ui/art-store.ts`). Only then it asks for the state and draws the first
screen, so no screen is ever drawn without its texts or its style. While
plugin.js does not answer, the view shows "QuestArc is starting" and
then "is not running" from what it carries itself, and asks again
(`ui/load-error.ts`); the content is asked for until it has come once.

Rules for new screens:

- A text is a key in `content/i18n/en.json`; a style rule goes into
  `style.css`. Neither costs room in `index.html`.
- `start.css` and the start texts (`START_TEXT_KEYS` in
  `packages/plugin/view-content.mjs`) grow only for what is shown
  before plugin.js answers.
- No module under `src/ui/` imports `shared/english.ts` or
  `shared/content.ts`: `build.mjs` fails when UI texts are found in
  `index.html`.
- Long static pages ("How QuestArc motivates you") are texts like any
  other: a list of keys in the screen, the words in `en.json`.

The standalone app (`packages/app`) is one page without messages: its
bundle has the texts, its `app.css` has `start.css` and `style.css`, and
its client answers `content` with the pictures only.

## Settings button of the plugin list

`registerConfigHandler` (plugin.js only; present in 19.3.0 and 20.0.0,
checked at the tags `v19.3.0` and `v20.0.0`: the host shows the button when
a handler exists and runs it on press) is registered in
`adapter/settings-entry.ts`, optional and inside `try`, like the hooks. The
handler calls `showIndexHtmlAsView()` and sets a one-shot flag; the next
`questarc:get` answer carries `openSettings: true` and the view pushes the
settings screen on its stack. The route takes no parameters, so the flag
travels in the state. A version without the member loses only the button.

## The action Show of a message

The view's home is the user's moments (#96), and a message's **Show**
leads to the build ([behaviour](behaviour.md), flow A). So the action
(`adapter/show-journey.ts`) works like the settings button: it sets a
one-shot flag and calls `showIndexHtmlAsView()`; the next
`questarc:get` answer carries `openJourney: true`, and the view puts
the journey on top of the home, so back leads to the moments. Opening
QuestArc from its header button or the side panel starts at the home.

## Task context menu

"Use for current QuestArc station" (Super Productivity 19.2.0 and newer)
binds the chosen task to the active journey's current stage
(`adapter/context-menu.ts`). A task that does not repeat yet is bound too;
the stage waits until the user sets its repeat.

## Reminders

QuestArc sends no notifications and changes no task
([game rules](game-rules.md) §9). The snapshot carries the repeat
configs' `startTime` and `remindAt` as `getAppState()` returns them.
After each evaluation `adapter/reminder-seen.ts` compares the view's
`reminder.set` of the followed stages (the active run's current stage,
the habits of finished journeys) with their `reminder-seen` records and
writes the day a reminder came or went, in the same step as a paused
repeat (below); then it evaluates again. Super Productivity reports a
plugin's own write with `persistedDataChanged`, which marks the cached
records stale: an evaluation therefore works on the records it loaded,
and the refresh that follows reads them again.

## Paused repeats

When the active stage's bound repeat config changes between paused and
not paused in Super Productivity, plugin.js writes a `pause` or `resume`
record with `source: "repeat-cfg"` for that day
([game rules](game-rules.md) §2, `adapter/repeat-pause.ts`). The first
evaluation after start only remembers the state. Devices that see the
same change write the same record.

## Not yet

- Nothing in the header button besides the icon: `registerHeaderButton`
  cannot update a label ([facts](super-productivity-facts.md) §7), and
  there is no level to show since 3.3 (#110).
