---
type: Decision Record
title: Others publish journeys by pull request
description: Anyone can write a journey, with or without an AI agent, and publish it as one self-contained file by pull request; CI checks the design rules, the owner merges; journeys are CC BY-SA 4.0 with the author shown in the app; private journeys come later with the same file.
tags: [decision, content, journeys, contributing, licence]
generated: { by: claude-code/2.1.318, at: 2026-11-06 }
---

# Others publish journeys by pull request

Decided by the owner on 2026-11-06 (#73, #74, #75).

## Problem

People should be able to design journeys with their own agents, for
example one for their job. Before, a journey's texts lived in the shared
`content/i18n/en.json`, the plugin listed journeys in code, the rules
were spread over several documents and nothing checked them except the
schema. Nobody outside the repository could write one.

## Options

1. **Import in the apps** (a file the user loads, stored as plugin data):
   private, but needs import screens in two hosts, an id namespace and a
   checker before anyone can share anything.
2. **Pull request to this repository:** a contributor adds one file, CI
   checks it, the owner merges what is good; it reaches everyone with the
   next release, in the plugin and in Pensum (which pins a release).
3. Both at once.

## Decision

Option 2 first; option 1 as private journeys in a later milestone (#40),
reusing everything prepared here.

- **One self-contained file per journey** (`content/journeys/<id>.json`)
  with its own `texts` per language, so a contribution is only a new
  file and pull requests do not conflict. The plugin finds every file in
  the folder. A later import accepts the same file unchanged.
- **The journey checker** (`journeyProblems`, engine) checks the design
  rules that can be checked mechanically; CI fails on errors, so the
  owner only judges whether a journey is good. Import will run the same
  function.
- **One self-contained guide**, [Writing a journey](../authoring-journeys.md),
  that an agent can work from alone, and a pull request template.
- **Licence:** journey files are **CC BY-SA 4.0** (`content/LICENSE`),
  not AGPL, because AGPL is meant for code. Contributors confirm in the
  pull request that they wrote the journey and publish it under that
  licence.
- **Attribution:** an optional `author` field, shown in the app as
  "Written by …". The guide says that the name stays public in git
  history. Authorship is the reward; there are no rankings (design rule
  21).

## Consequences

- A merged journey appears only with the next release; the owner tags
  releases.
- Nobody can use a journey without publishing it until #40.
- Journeys written by the project have no `author`.
- Pensum receives the journeys through the release archive, which
  copies `content/`, including the licence.
