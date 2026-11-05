# QuestArc

Habits as journeys: QuestArc turns the habits you build in
[Super Productivity](https://super-productivity.com) into a journey along
a path, one small step at a time. Calm by default, with an optional RPG
layer.

> **Status:** QuestArc 3.0 is being rebuilt from scratch. There is no
> working release of 3.0 yet. Version 2.x is no longer maintained; its
> code is in the git history (commit `8ec9137`).

QuestArc runs in two places with the same game and the same data:

- as a plugin for Super Productivity;
- inside [Pensum](https://github.com/nexumia-de/pensum), a native app for
  Linux phones (Phosh) on Super Productivity's data.

## Documents

- [Roadmap](docs/roadmap.md): milestones and the journey.
- [Architecture](docs/architecture.md): one engine, two hosts, decisions.
- [Psychology](docs/psychology.md): what helps people build habits, and
  the design rules that follow.
- [Super Productivity facts](docs/super-productivity-facts.md): the plugin
  API and data QuestArc relies on.
- [All documents](docs/index.md).

## Development

```sh
npm ci
npm run check
```

Details in [development](docs/development.md).

Work items are [issues](https://github.com/nexumia-de/QuestArc/issues) in
[milestones](https://github.com/nexumia-de/QuestArc/milestones).

## Licence

QuestArc is free software under the GNU Affero General Public License,
version 3 or later ([LICENSE](LICENSE)), © 2026 suitably. The copy of
Super Productivity's plugin API types in `packages/sp-plugin-api` keeps
its MIT licence.
