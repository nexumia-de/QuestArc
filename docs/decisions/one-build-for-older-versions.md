---
type: Decision Record
title: One plugin build for older Super Productivity versions
description: QuestArc ships one ZIP that installs in Super Productivity 19.3.x and every later version; minSupVersion is not raised to get larger limits, the build stays inside the limits of the oldest supported version, and newer API members are feature-detected.
tags: [decision, plugin, super-productivity, release]
generated: { by: claude-code, at: 2026-11-12 }
sources:
  - id: issue102
    title: 'Plugin: one build for Super Productivity 19.3 and later (#102)'
    url: https://github.com/nexumia-de/quest-arc/issues/102
---

# One plugin build for older Super Productivity versions

The owner, 2026-11-12, correcting issue #102[^issue102]: older Super
Productivity versions stay supported, and there is only one build. The
plugin does not require 20.0.0.

## Problem

Super Productivity 19.3.x refuses a plugin `index.html` above 100 KB
(102,400 bytes); 20.0.0 allows 1 MB
([facts](../super-productivity-facts.md) §1). The journey screen with the
build (#100) brought the view close to the old limit. Raising
`minSupVersion` to 20.0.0 would lift it, but users who have not updated
(the Android and iOS apps may ship later) could no longer install or
update QuestArc.

## Options

1. **Require 20.0.0**: one build, 1 MB, 19.3.x users locked out.
2. **Two builds**: a small ZIP for 19.3.x and a larger one for 20.0.0.
3. **One build within the oldest limits**: one ZIP for 19.3.x and later.

## Decision

Option 3.

- `minSupVersion` stays `19.3.0`. It is raised only when the owner
  decides so, never to gain room.
- `packages/plugin/build.mjs` keeps failing above 102,400 bytes for
  `index.html`, as long as 19.3.x is supported.
- What does not fit in the view travels in `plugin.js` (up to 5 MiB) and
  reaches the view by message, as the ladders' pictures (`questarc:art`)
  and the journeys' texts already do.
- API members that only newer versions have (`DATA_CHANGED`,
  `DAY_CHANGE`, `getDayContext`, …) are optional and feature-detected;
  QuestArc works without them.
- The real-app check runs against the oldest supported version (19.3.1).
  A check against a newer version is an addition, not a replacement.

State on 2026-11-13, after 20.0.0 was released: the fallbacks are in
place and 3.2.1 still installs in 19.3.x; every 20.0.0 member QuestArc
uses is already used where it exists.

## Consequences

- No second ZIP, no version switch in the build or the release workflow.
- The view's size budget remains a constraint for new screens; the build
  reports the bytes left.
- Stripping whitespace (#103) stays.

[^issue102]: https://github.com/nexumia-de/quest-arc/issues/102
