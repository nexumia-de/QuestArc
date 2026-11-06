# Changelog

Changes that users notice, newest first. Versions follow the plugin's
`manifest.json`; each version is a
[GitHub release](https://github.com/nexumia-de/QuestArc/releases) with the
plugin ZIP.

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
