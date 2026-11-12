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

## Engine speed (issue #83)

The skeleton measurements above say little about the real engine. A
generated large input (`packages/engine/test/large-snapshot.ts`): 50,000
unrelated done archived tasks over five years, one journey (`test-daily`)
with two finished stages and a third met, one bound daily repeat config
with 1,800 days of history (1,655 instances), 8.2 MB as JSON. Same result
before and after: all 71 + 35 tests including every vector pass unchanged,
and the test checks the journey's XP and completions.

**Where the time went.** `snapshotFromHost` converted every archived task
(an object and a map entry each) before `buildSnapshot` dropped the ones no
binding points to. It now filters the raw archived tasks first, reading only
`id` and `repeatCfgId`, and converts the rest; the snapshot is identical
(the test compares it with the unfiltered one). The same journey, only the
archive grows; `JSON.parse` and `snapshotFromHost` + `evaluate` timed
separately, median of six warm runs, Node 22.23 on the x86_64 cloud host
(Intel Xeon 2.1 GHz, 4 cores):

| Unrelated archived tasks | JSON    | parse ms | snapshot + evaluate, before ms | after ms |
| ------------------------ | ------- | -------- | ------------------------------ | -------- |
| 0                        | 0.3 MB  | 1        | 7                              | 7        |
| 5,000                    | 1.1 MB  | 6        | 8                              | 6        |
| 50,000                   | 8.2 MB  | 41       | 25                             | 14       |
| 200,000                  | 31.9 MB | 243      | 81                             | 15       |

After the change the engine's cost is the journey's own history (about
7 to 15 ms here) and no longer follows the archive. What still grows is
`JSON.parse`; only the host can avoid that, by not serialising tasks that are
not instances of bound repeat configs (Pensum: filter before the call). The
rows are noisy by a few ms (the first run of a process is slower).

Whole gjs process (start, read stdin, parse, evaluate, print) for the 8.2 MB
input, gjs 1.80.2 from Ubuntu 24.04 (not GNOME 51's 1.90.1), best of three:
170 to 200 ms before the filter and 167 to 185 ms after (three test runs
each); Node in-process: 63 to 68 ms before, 44 to 49 ms after. The
budgets in the test are 300 ms (Node) and 1,000 ms (gjs process), loose
enough for slow CI runners, tight enough to catch a return to quadratic or
unfiltered behaviour.

**aarch64.** CI job `speed-aarch64` (arm64 runner `ubuntu-24.04-arm`) runs
the same test in Node and gjs and writes the times and `lscpu`'s CPU model to
the job summary. This is a runner measurement, not a phone measurement. The
factor to the phone could not be stated: the target phone's model is still
`TODO` in the toolkit's `docs/device.md`, and no run of the arm64 job
exists yet, so there is no runner CPU or time to quote either. Fill in below
from the first job summary and the phone's public single-core score, with
source.

| Item                              | Value                 |
| --------------------------------- | --------------------- |
| Runner CPU (from the job summary) | not yet measured      |
| Large input, gjs process, best ms | not yet measured      |
| Phone model and single-core ratio | unknown (device TODO) |

## Open

- Measurement on the phone (aarch64), with the engine archive of the
  first release that has one. If a typical dataset takes noticeably long
  there, Pensum keeps one gjs process running instead of starting one per
  evaluation; a Python port stays the last resort.
- The cost grows with the real engine; the speed budget test (above) keeps
  watching it in CI.
