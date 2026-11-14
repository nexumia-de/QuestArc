---
type: Decision Record
title: The standalone app is a third host in this repository
description: QuestArc gets a standalone web app for people without Super Productivity. It lives in this repository as packages/app next to the plugin; the screens and the adapter core are one shared package, packages/ui, that both hosts wrap. PWA first, then an APK; no Flatpak; released on its own tags.
tags: [decision, standalone-app, architecture, packages, pwa]
generated: { by: claude-code/2.1.325, at: 2026-11-14 }
sources:
  - id: issue91
    title: "Standalone QuestArc app: one web app as PWA, APK and Flatpak (#91), with the owner's decisions of 2026-11-12 and 2026-11-14 in its comments"
    url: https://github.com/nexumia-de/quest-arc/issues/91
  - id: spike
    title: 'Spike: the screens and the engine as a standalone web app'
    url: standalone-app-spike.md
---

# The standalone app is a third host in this repository

## Context

QuestArc was "a plugin and an engine": one pure engine with two hosts,
the Super Productivity plugin here and the game page in Pensum
([architecture](../architecture.md)). Who is not reached is everyone who
wants the journeys but no task manager (#91[^issue91]). The spike showed
that the plugin's screens, adapter and engine run unchanged as an
offline web app on a small dataset in Super Productivity's backup
format[^spike].

## Decision

1. **A third host.** The standalone app is a host of the same engine:
   rule 4 of the architecture stays (all game decisions in
   `packages/engine`). It is not a task manager: no projects, tags,
   timers or one-off tasks.
2. **Same repository** (owner, 2026-11-14). The app is `packages/app`
   here, not a repository of its own. It shares the code that changes
   most, and a rule change stays one pull request: document, test
   vectors, engine and both hosts. A second repository would need a
   release of the shared packages and a version bump for every such
   change.
3. **One shared package** (owner, 2026-11-14[^issue91]). `packages/ui`
   holds the screens and the host-independent adapter core (brain,
   records, hooks, day, messages in words, the pictures' pack); plugin
   and app are thin shells around it:

   ```
   packages/engine   the rules, pure
   packages/ui       screens, style and default theme, adapter core
   packages/plugin   Super Productivity host: plugin.js, the view's transport, the manifest
   packages/app      standalone host: store, Today and Data, service worker
   ```

   `packages/ui` never imports from a host. The screens get their host
   passed in (`createApp(root, client, host)`); a host that can create a
   recurring task offers `createHabit`, so the app needs no hand-over of
   the repeat ([recurring-task setup](recurring-task-setup.md) stays the
   plugin's way).

4. **Texts that name the host** stay in `content/i18n` in the plugin's
   wording; the app replaces the few keys that differ with its own
   table. The shared texts module gets no host switch.
5. **Packages and releases** (owner, 2026-11-12[^issue91]): a PWA on
   GitHub Pages first, then an APK (GitHub releases, F-Droid, Google
   Play). **No Flatpak**: Day Planner is the Flatpak home of the
   journeys, and Linux desktop users can install the PWA. The app is
   released on its own tags, apart from the plugin's `v<version>`; the
   tag pattern is fixed with the first release.
6. **Visible name**: "QuestArc: Habit Journeys", shown as QuestArc on a
   home screen (owner, 2026-11-12[^issue91]).
7. **No plain habits** (owner, 2026-11-14[^issue91]): Today shows the
   moments with the one growing step; what runs by itself is not ticked.
8. **Day start**: the app's dataset carries Super Productivity's whole
   default configuration, so an export imports without repair and the
   day start travels with the backup (owner, 2026-11-14[^issue91]).

## Consequences

- The repository is no longer "a plugin and an engine" only; the
  [architecture](../architecture.md) names three hosts. The phosh-toolkit
  GTK and Flatpak rules still do not apply here (D6).
- The no-network rule holds for the app as for the plugin: after the
  first load the page asks the network for nothing; the APK carries
  everything.
- A change to a screen is tested in both hosts: the plugin's real-app
  job and the app's walk (`standalone-app` in CI, not a required check
  for now).
- Open in the plan (#91): the dataset's default configuration, the
  Today screen by moments, a habit's page, automatic local backups, the
  PWA release, the APK with reminders.

[^issue91]: Standalone QuestArc app (#91) and the owner's decisions in its comments, https://github.com/nexumia-de/quest-arc/issues/91

[^spike]: [Spike: the screens and the engine as a standalone web app](standalone-app-spike.md)
