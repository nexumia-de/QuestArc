---
type: Decision Record
title: Pensum runs the engine in gjs
description: The TypeScript engine is built once and run by Pensum through gjs from the GNOME runtime; measured on x86, the phone measurement is still open.
tags: [engine, gjs, pensum, spike]
generated: { by: claude-code/2.1.318, at: 2026-11-05 }
---

# Pensum runs the engine in gjs

## Question

Pensum is written in Python. Can it use QuestArc's TypeScript engine as
it is, or does the engine need a second implementation?

## Spike (issue #16)

- `gjs 1.90.1` is part of `org.gnome.Platform//51`, the runtime Pensum's
  Flatpak uses. It runs ES2022 modules (`-m`) and newer features such as
  `Array.prototype.at` and `Object.groupBy`.
- The engine builds to one dependency-free module (`dist/engine.mjs`); the
  gjs wrapper `dist/engine-cli.mjs` reads a snapshot as JSON from stdin
  (through `Gio.File` on `/dev/stdin`) and prints the game view as JSON.
- Measured on the cloud host (x86_64), whole process including start,
  three runs each, skeleton engine (completed tasks and time spent):

| Snapshot                  | Node 22   | gjs 1.90.1 (GNOME 51) |
| ------------------------- | --------- | --------------------- |
| empty                     | 39–47 ms  | 54–85 ms              |
| 5,000 tasks (0.7 MB JSON) | 42–44 ms  | 60–84 ms              |
| 50,000 tasks (7 MB JSON)  | 85–106 ms | 121–147 ms            |

Both runtimes returned identical results.

- In the cloud container `flatpak run` fails ("Could not connect"); gjs
  was started from the runtime's files with `bwrap`, as described in
  [development](../development.md).

## Decision

Go: Pensum runs the engine through gjs; no Python port. The engine stays
dependency-free and host-free so this keeps working.

## Later finding

The first wrapper opened `/dev/stdin` as a file. That fails when stdin is
a socket instead of a pipe (Node's child processes use sockets): gjs
reported "No such device or address". The wrapper now reads stdin as a
stream (`GioUnix.InputStream` on fd 0, GLib 2.80 or newer), which works
with pipes and sockets. All test vectors give identical results in Node
and in gjs 1.90.1 from GNOME 51.

## Open

- Measurement on the phone (aarch64), with the engine archive of the
  first release that has one. If a typical dataset takes noticeably long
  there, Pensum keeps one gjs process running instead of starting one per
  evaluation; a Python port stays the last resort.
- The cost grows with the real engine; the test vectors will include a
  large snapshot so a slowdown shows up in CI.
