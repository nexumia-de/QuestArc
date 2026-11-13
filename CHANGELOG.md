# Changelog

Changes that users notice, newest first. Versions follow the plugin's
`manifest.json`; each version is a
[GitHub release](https://github.com/nexumia-de/quest-arc/releases) with the
plugin ZIP.

## 3.3.0

- **One look: every journey builds something.** The choice between
  "Calm" and "With game" is gone. Every journey now shows what it builds;
  the stations are a list under **Stations** in the menu, and the drawn
  path is removed.
- **No XP, levels or guardians any more.** They had no effect since
  3.2.0. Messages say your real progress in words ("Drink a glass of
  water: done. 4 of 5 days.") and always offer **Show**.
- The stories of _A gentle morning_ and _First Things First_ are
  rewritten to fit building, without opponents.
- A journey you continue with 3.3.0 can only be read on a device with an
  older QuestArc until you update it there. Nothing is lost.
- For journey authors: a `guardian` in a stage is refused by the checker.

## 3.2.1

- After you switch QuestArc off or install a new version, the old one
  no longer checks your tasks one more time in the background.

## 3.2.0

- **With the game, a journey now builds something.** Instead of the path
  the journey screen shows one thing that is whole at every station and
  becomes a larger version with the next: _A gentle morning_ grows from a
  fireplace to a house, _First Things First_ from stepping stones to a
  covered bridge. While you work on a station, a line of lanterns,
  pennants or flowers grows in front of it and lights up when the station
  is ready. Nothing is ever taken down. Calm mode keeps the path; with
  the game it is under **Stations** in the menu.
- When you start a journey with the game you can change what it builds,
  what hangs on the line and the colour; later under **What you build**
  in the menu.
- With the game, the message after completing the journey's task has a
  **Show** button that opens the journey screen, where the new piece
  appears.
- A journey that was continued with a newer QuestArc on another device
  is shown read-only instead of being changed by the older one.

## 3.1.0

- New journey **First Things First**, for work: on workdays, from writing
  down the one task that matters most to 45 quiet minutes on it, email
  and chat in one block and a short look back at yesterday.
- Journeys written by others show their author ("Written by …") in the
  list and the preview. Anyone can write a journey, alone or with an AI
  agent, and publish it by pull request; see
  [Writing a journey](docs/authoring-journeys.md).

## 3.0.1

- Clearer messages when QuestArc cannot load: "QuestArc is starting"
  while Super Productivity is still loading it (after starting the app,
  an update or switching it on), "QuestArc is not running" with what to
  check, and the reason when reading your data failed. The message now
  goes away as soon as QuestArc answers, and it spans the whole width
  above the journey.
- One icon everywhere: the side menu and the page header now show the
  same route icon as the button at the top right, instead of a drawn
  icon that looked like a blob.
- In dark mode the unselected choice ("With game", start day) no longer
  shows as a white disc.

## 3.0.0

A new start: QuestArc 3.0 is rebuilt from scratch and does not read 2.x
quests ([coming from 2.x](README.md#coming-from-questarc-2x)). Needs
Super Productivity 19.3.0 or newer.

- Habits as a journey: a path of small stations, each one a habit step
  anchored to a moment, with the first built-in journey _A gentle
  morning_.
- Start a journey with your own reason and a start day; QuestArc creates
  the station's task or uses an existing recurring task, and you set the
  repeat in Super Productivity.
- Progress comes from your ticked-off tasks: the last seven due days, runs,
  a message after each completion, and the next station's story when a
  station is reached.
- Missed days are neutral gaps; a hard week offers the earlier step;
  journeys can be paused, resumed and ended with Undo.
- Weekly look back with one question about how automatic the habit has
  become; welcome back after a gap; a learning nugget at each station.
- Calm mode by default; the optional game layer adds XP, levels and
  guardians.
- Shelf with waiting journeys, habits that stay and finished journeys.
- The page "How QuestArc motivates you", and a setting that removes
  QuestArc's data while your tasks stay.
- Works at phone size (360 px) and on the desktop, in light and dark.
