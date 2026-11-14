// The look back (#84): reads a Super Productivity backup, runs the built
// engine on it and prints, for the owner only, how each stage of each run
// went: due days, completions, gaps, run-ending misses, days from
// acceptance to met, the weekly answers by week and how often the backfill
// window was used.
//
//   npm run build -w @questarc/engine
//   node scripts/look-back.mjs backup.json [--today YYYY-MM-DD] [--tz Europe/Berlin]
//
// Ids, days and counts only: never a title, a note or the user's reason.
// No network; nothing is written. The engine's rules are not changed or
// copied: the numbers it does not expose are derived by asking it again,
// as of each day of a stage, with the stage's checkpoint left out (see
// docs/development.md, "Look back").
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

const root = join(import.meta.dirname, '..');
const enginePath = join(root, 'packages', 'engine', 'dist', 'engine.mjs');

const usage = 'usage: node scripts/look-back.mjs <backup.json> [--today YYYY-MM-DD] [--tz <zone>]';
const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

// ---- arguments -----------------------------------------------------------

const args = process.argv.slice(2);
const option = (name) => {
  const at = args.indexOf(name);
  if (at === -1) return undefined;
  const [, value] = args.splice(at, 2);
  return value;
};
const todayOption = option('--today');
const zoneOption = option('--tz');
if (args.length !== 1 || args[0].startsWith('--')) fail(usage);
if (todayOption !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(todayOption)) fail(usage);
if (!existsSync(enginePath))
  fail('The engine is not built: run `npm run build -w @questarc/engine`.');

const { evaluate, snapshotFromHost, isoWeek } = await import(enginePath);

// ---- days ----------------------------------------------------------------

const DAY_MS = 86_400_000;
const utc = (day) => Date.parse(`${day}T00:00:00Z`);
const addDays = (day, n) => new Date(utc(day) + n * DAY_MS).toISOString().slice(0, 10);
const dayRange = (from, to) => {
  const days = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
};
const logicalDayOf = (timeZone, offsetMs) => {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return (timestamp) => format.format(new Date(timestamp - offsetMs));
};

// ---- the backup ----------------------------------------------------------

let backup;
try {
  backup = JSON.parse(readFileSync(args[0], 'utf8'));
} catch (error) {
  fail(`Cannot read ${args[0]}: ${error.code ?? 'not valid JSON'}`);
}
const data = backup?.data ?? backup;
if (typeof data !== 'object' || data === null) fail('Not a Super Productivity backup.');

const entitiesOf = (slice) => Object.values(slice?.entities ?? {});
const startOfNextDayMs = (misc = {}) => {
  const time = misc.startOfNextDayTime;
  if (typeof time === 'string' && time.includes(':')) {
    const [h, m] = time.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) return (h * 60 + m) * 60_000;
  }
  return typeof misc.startOfNextDay === 'number' ? misc.startOfNextDay * 3_600_000 : 0;
};

/** The questarc choice records: key → parsed value (data-model §2, §4). */
const records = {};
for (const entry of Array.isArray(data.pluginUserData) ? data.pluginUserData : []) {
  if (typeof entry?.id !== 'string' || !entry.id.startsWith('questarc:')) continue;
  let text = entry.data;
  if (typeof text === 'string' && text.startsWith('GZ1:')) {
    try {
      text = gunzipSync(Buffer.from(text.slice(4), 'base64')).toString('utf8');
    } catch {
      continue;
    }
  }
  if (typeof text !== 'string' || text === '') continue;
  try {
    records[entry.id.slice('questarc:'.length)] = JSON.parse(text);
  } catch {
    records[entry.id.slice('questarc:'.length)] = text;
  }
}

const timeZone = zoneOption ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
const offsetMs = startOfNextDayMs(data.globalConfig?.misc);
const logicalDay = logicalDayOf(timeZone, offsetMs);
const today = todayOption ?? logicalDay(Date.now());

const journeysDir = join(root, 'content', 'journeys');
const journeys = readdirSync(journeysDir)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => JSON.parse(readFileSync(join(journeysDir, name), 'utf8')));

const snapshot = snapshotFromHost({
  day: { todayStr: today, startOfNextDayDiffMs: offsetMs, timeZone },
  live: entitiesOf(data.task),
  archived: [...entitiesOf(data.archiveYoung?.task), ...entitiesOf(data.archiveOld?.task)],
  repeatCfgs: entitiesOf(data.taskRepeatCfg),
  records,
  journeys,
});

const viewAt = (day, choices, tasks = snapshot.tasks) =>
  evaluate({ ...snapshot, day: { ...snapshot.day, todayStr: day }, tasks, choices });
const view = viewAt(today, snapshot.choices);

/** The tasks as they were at the end of `day`: later completions are not yet there. */
const tasksAsOf = (day) =>
  snapshot.tasks.map((task) =>
    task.isDone && typeof task.doneOn === 'number' && logicalDay(task.doneOn) > day
      ? { ...task, isDone: false, doneOn: null, wontDoOn: null }
      : task,
  );

// ---- per stage -----------------------------------------------------------

const isDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Completed instances of the stage's repeat config by when they were ticked off. */
const backfill = (runId, stageId, from, to) => {
  const binding = snapshot.choices[`binding:${runId}:${stageId}`];
  const boundTask = snapshot.tasks.find((task) => task.id === binding?.taskId);
  const cfgId = binding?.repeatCfgId || boundTask?.repeatCfgId;
  const count = { sameDay: 0, window: 0, late: 0 };
  if (!cfgId) return count;
  const countFrom = isDay(binding.day) && binding.day > from ? binding.day : from;
  for (const task of snapshot.tasks) {
    if (task.repeatCfgId !== cfgId || !task.isDone || typeof task.doneOn !== 'number') continue;
    if (task.wontDoOn != null && task.wontDoOn === task.doneOn) continue;
    const idDay = task.id.startsWith(`rpt_${cfgId}_`) ? task.id.slice(`rpt_${cfgId}_`.length) : '';
    const own = isDay(idDay)
      ? idDay
      : isDay(task.dueDay)
        ? task.dueDay
        : typeof task.created === 'number'
          ? logicalDay(task.created)
          : undefined;
    if (!own || own < countFrom || own > to) continue;
    const done = logicalDay(task.doneOn);
    if (done <= own) count.sameDay += 1;
    else if (done === addDays(own, 1)) count.window += 1;
    else count.late += 1;
  }
  return count;
};

const runOf = (v, runId) =>
  [...(v.active ? [v.active] : []), ...v.paused, ...v.finished].find((run) => run.runId === runId);
const stationOf = (v, runId, stageId) =>
  runOf(v, runId)?.stations.find((station) => station.stageId === stageId);

/** One stage, asked again as of each of its days (the checkpoint left out). */
const lookAtStage = (run, station, acceptedDay, runEnd) => {
  const { runId, stageId } = { runId: run.runId, stageId: station.stageId };
  const end = [station.doneDay, runEnd, today].filter(isDay).sort()[0];
  const checkpoint = `stage-done:${runId}:${stageId}`;
  const choices = Object.fromEntries(
    Object.entries(snapshot.choices).filter(([key]) => key !== checkpoint),
  );

  const marks = new Map();
  const doneSeen = new Set();
  let previous = 0;
  let fallback = false;
  let endingMisses = 0;
  let daysToMet;
  let last;
  for (const day of dayRange(acceptedDay, end)) {
    const asOf = viewAt(day, choices, tasksAsOf(day));
    last = stationOf(asOf, runId, stageId);
    if (!last?.lastDays) return undefined; // unbound or unsupported repeat
    // A day older than yesterday is settled: its mark does not change again.
    for (const { day: d, mark } of last.lastDays) if (d < addDays(day, -1)) marks.set(d, mark);
    // The engine ends the run (current → 0) at a second miss in a row. The
    // run is shorter than it would have been with the new done days, or the
    // fallback is offered now: that step holds a run-ending miss.
    const before = doneSeen.size;
    for (const { day: d, mark } of last.lastDays) if (mark === 'done') doneSeen.add(d);
    const offered = runOf(asOf, runId)?.offerFallback === true;
    if (last.run.current < previous + doneSeen.size - before || (offered && !fallback)) {
      endingMisses += 1;
    }
    previous = last.run.current;
    fallback = offered;
    if (daysToMet === undefined && last.state === 'met') {
      daysToMet = Math.round((utc(day) - utc(acceptedDay)) / DAY_MS);
    }
  }
  for (const { day: d, mark } of last.lastDays) marks.set(d, mark);

  const count = (name) => [...marks.values()].filter((mark) => mark === name).length;
  const done = count('done');
  const gap = count('gap');
  const open = count('open');
  return {
    end,
    due: done + gap + open,
    done,
    gap,
    open,
    paused: count('paused'),
    completions: last.completions,
    welcomeBacks: last.welcomeBacks,
    best: last.run.best,
    endingMisses,
    daysToMet,
    backfill: backfill(runId, stageId, acceptedDay, end),
  };
};

const weekly = (run, stageId, acceptedDay, end) => {
  const prefix = `checkin:${run.runId}:${stageId}:`;
  const answers = Object.entries(snapshot.choices)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, value]) => [key.slice(prefix.length), value?.score])
    .sort(([a], [b]) => a.localeCompare(b));
  const asked = new Set(
    acceptedDay <= addDays(end, -7) ? dayRange(addDays(acceptedDay, 7), end).map(isoWeek) : [],
  );
  return {
    answers,
    asked: asked.size,
    answered: answers.filter(([week]) => asked.has(week)).length,
  };
};

// ---- output --------------------------------------------------------------

const lines = [];
const out = (text = '') => lines.push(text);
const total = { stages: 0, due: 0, done: 0, gap: 0, endingMisses: 0, window: 0, completions: 0 };

out(`Look back as of ${today} (${timeZone}, day starts ${offsetMs / 3_600_000} h after midnight)`);

const runs = [
  ...(view.active ? [['active', view.active]] : []),
  ...view.paused.map((run) => ['paused', run]),
  ...view.finished.map((run) => ['ended', run]),
];
for (const [state, run] of runs) {
  const runEnd = snapshot.choices[`run-end:${run.runId}`]?.day;
  out();
  out(`run ${run.runId}  journey ${run.journeyId}  started ${run.startDay}  ${state}`);
  let lastDone = run.startDay;
  for (const station of run.stations) {
    if (station.state === 'ahead') {
      out(`  stage ${station.stageId}: ahead`);
      continue;
    }
    const acceptedDay =
      snapshot.choices[`stage:${run.runId}:${station.stageId}`]?.acceptedDay ?? lastDone;
    if (station.doneDay) lastDone = station.doneDay;
    const stats = isDay(acceptedDay) ? lookAtStage(run, station, acceptedDay, runEnd) : undefined;
    if (!stats) {
      out(`  stage ${station.stageId}: ${station.state}, not computable (no bound repeating task)`);
      continue;
    }
    const { answers, asked, answered } = weekly(run, station.stageId, acceptedDay, stats.end);
    const { sameDay, window, late } = stats.backfill;
    out(`  stage ${station.stageId}: ${station.state}, accepted ${acceptedDay}, to ${stats.end}`);
    out(
      `    due days ${stats.due}: done ${stats.done}, gaps ${stats.gap}, still open ${stats.open}; paused days ${stats.paused}`,
    );
    out(
      `    completions ${stats.completions}, welcome backs ${stats.welcomeBacks}, best run ${stats.best}, run-ending misses ${stats.endingMisses}`,
    );
    out(
      `    days from acceptance to met: ${stats.daysToMet === undefined ? 'not met' : stats.daysToMet}`,
    );
    out(
      `    backfill window used ${window} of ${sameDay + window + late} (same day ${sameDay}, later than the window ${late})`,
    );
    out(
      `    weekly answers ${answered} of ${asked} weeks asked: ${answers.length ? answers.map(([week, score]) => `${week}=${Number.isInteger(score) ? score : '?'}`).join(' ') : 'none'}`,
    );
    total.stages += 1;
    total.due += stats.due;
    total.done += stats.done;
    total.gap += stats.gap;
    total.endingMisses += stats.endingMisses;
    total.window += window;
    total.completions += sameDay + window + late;
  }
}
for (const run of view.readOnly) {
  out();
  out(`run ${run.runId}  journey ${run.journeyId}  read-only (${run.reason}), not looked at`);
}
if (runs.length === 0 && view.readOnly.length === 0) {
  out();
  out('No QuestArc run in this backup.');
} else {
  out();
  out(
    `all stages (${total.stages}): due days ${total.due}, done ${total.done}, gaps ${total.gap}, run-ending misses ${total.endingMisses}, backfill used ${total.window} of ${total.completions} completions`,
  );
}
if (view.problems.length > 0) out(`problems the engine reported: ${view.problems.length}`);

process.stdout.write(`${lines.join('\n')}\n`);
