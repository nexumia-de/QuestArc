@../phosh-toolkit/agents/core.md

# QuestArc

Habits as journeys: a habit grows in small stages, and every journey
builds one thing that grows with it. One pure game engine, two hosts: a
plugin for [Super Productivity](https://super-productivity.com) and a
game page in [Pensum](https://github.com/nexumia-de/pensum), the native
Phosh app on the same data. Knowledge of this repository:
[docs/index.md](docs/index.md).

QuestArc is a Super Productivity plugin and an engine, not a GTK app
(decision D6 in [docs/architecture.md](docs/architecture.md)). The UI
rules for 360 px, touch targets and accessibility are in
[docs/behaviour.md](docs/behaviour.md).

## Work only from the documents

- QuestArc 3.0 is built from scratch from `docs/`; the 2.x code in git
  history is not a source (decision D8).
- Before a change, read the documents it touches:
  [game rules](docs/game-rules.md), [design rules](docs/psychology.md),
  [data model](docs/data-model.md), [story format](docs/story-format.md),
  [behaviour](docs/behaviour.md), [journey design](docs/journey-design.md),
  [Super Productivity facts](docs/super-productivity-facts.md).
- A change to a rule changes the document, its test vectors and the code
  in the same pull request. Never let code and documents disagree.
- A new journey is one file in `content/journeys/`, written along
  [Writing a journey](docs/authoring-journeys.md) and clean in
  `npm run journeys`.

## Architecture rules

- **Derive, don't count.** Progress, runs and the build are
  computed by the engine from task data every time. Only choice records
  are stored ([data model](docs/data-model.md)), one plugin-data key
  each.
- **The engine is pure** (`packages/engine`): no clock, no machine time
  zone, no randomness, no logging, no host API; ESLint enforces it. Every
  rule has a test vector in `packages/engine/vectors/` that must pass in
  Node and in gjs.
- **The user's tasks stay the user's.** Never write into task titles or
  notes, never rename projects, never reopen or delete tasks, never end a
  repeat config. Change a task only when the user asks for exactly that.
- **No telemetry, no third-party services, no network requests** from the
  plugin.
- Super Productivity facts come from its source at a recorded commit; the
  plugin API types are the copy in `packages/sp-plugin-api` (MIT, do not
  edit; update with `scripts/update-sp-plugin-api.sh`).
- Logs name ids and counts, never task titles, notes or the user's own
  reason.

## Design rules

The 27 [design rules](docs/psychology.md) are binding, among them: one calm
look without points, levels or opponents; what grows follows fixed
rules and is never announced before it is earned; no random rewards, login bonuses or rankings; a missed day is a
neutral gap, never red, never blamed; autonomy-supportive texts; no
generic motivational quotes; no promised number of days.

## Before committing

1. `npm run check` (format, lint, typecheck, tests, build) passes.
2. Screens checked at 360 × 720 and at a desktop size when the UI
   changed.

## Releases

A tag `v<version>` matching `packages/plugin/src/manifest.json` runs the
release workflow (plugin ZIP and checksum on a GitHub release). The
owner tags releases; agents do not.
