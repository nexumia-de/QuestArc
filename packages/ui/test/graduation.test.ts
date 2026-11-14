import { answerStill, bringBack, graduate } from '@questarc/engine';
import { describe, expect, it } from 'vitest';

import { createBrain } from '../src/adapter/brain';
import { messageFor } from '../src/adapter/snacks';
import { builtInJourneys } from '../src/shared/content';
import { habitsOf, targetOf } from '../src/ui/habit';
import { createFakeHost, dailyHabit, noon } from '../src/testing/fake-host';

// Flow F with the real adapter (docs/behaviour.md): "A gentle morning"
// was finished on 1 October; its last habit kept repeating. Today is
// Monday 2 November 2026 (ISO week 45).
const RUN = 'run-1';
const STAGES = ['water', 'stretch-1', 'stretch-5', 'plan-day'];
const days = (from: string, to: string): string[] => {
  const out: string[] = [];
  for (let ms = noon(from); ms <= noon(to); ms += 86_400_000)
    out.push(new Date(ms).toISOString().slice(0, 10));
  return out;
};

const setUp = (answers: Record<string, number>) => {
  const fake = createFakeHost();
  const habit = dailyHabit('cfg1', '2026-09-15', days('2026-09-15', '2026-11-01'));
  fake.host.repeatCfgs.cfg1 = habit.cfg;
  for (const task of habit.tasks) fake.host.tasks[task.id] = task;
  const record = (key: string, value: unknown) => {
    fake.host.data[key] = JSON.stringify(value);
  };
  record(`run:${RUN}`, { journeyId: 'gentle-morning', journeyVersion: 1, startDay: '2026-08-01' });
  STAGES.forEach((stage, i) => {
    record(`stage:${RUN}:${stage}`, {
      acceptedDay: `2026-0${8 + Math.floor(i / 2)}-${i % 2 ? 15 : '01'}`,
    });
    record(`stage-done:${RUN}:${stage}`, { day: '2026-10-01', dataFormat: 2 });
  });
  record(`binding:${RUN}:plan-day`, {
    taskId: 'rpt_cfg1_2026-09-15',
    repeatCfgId: 'cfg1',
    day: '2026-09-15',
  });
  record(`run-end:${RUN}`, { day: '2026-10-01', reason: 'finished' });
  for (const [week, score] of Object.entries(answers))
    record(`checkin:${RUN}:plan-day:${week}`, { score });
  const messages: string[] = [];
  const brain = createBrain({
    api: fake.api,
    journeys: builtInJourneys,
    debounceMs: 10,
    onEvents: (events, view, journeys) => {
      const msg = messageFor(events, view, journeys);
      if (msg) messages.push(msg);
    },
  });
  return { ...fake, brain, messages };
};

const high = { '2026-W43': 6, '2026-W44': 7, '2026-W45': 6 };

describe('graduation in the plugin (#22)', () => {
  it('follows the habit of a finished journey and asks its weekly question', async () => {
    const { brain } = setUp({ '2026-W43': 4 });
    const state = { ...(await brain.state()), revision: 1 };
    brain.stop();
    const [entry] = habitsOf(state);
    expect(entry?.stage.id).toBe('plan-day');
    expect(entry?.habit).toMatchObject({
      state: 'maintained',
      checkinDue: true,
      canGraduate: false,
      // 15 September to 1 November, past the journey's end on 1 October (#66)
      run: { current: 48, best: 48, total: 48, gap: false },
    });
    expect(entry?.habit.lastDays?.at(-1)).toEqual({ day: '2026-11-02', mark: 'open' });
    // The look back and the task screens work on the habit when its run is named.
    expect(targetOf(state, RUN)).toMatchObject({ index: 3, state: 'maintained' });
    expect(targetOf(state)).toBeUndefined();
    expect(targetOf(state, 'no-such-run')).toBeUndefined();
  });

  it('graduates, asks after two weeks, and brings the habit back without a loss', async () => {
    const { brain, host, messages } = setUp(high);
    const before = await brain.state();
    const run = before.view.finished[0];
    if (!run?.habit?.canGraduate) throw new Error('cannot graduate');

    const graduated = await brain.write(graduate(run, host.today, 'keep'));
    expect(graduated.view.problems).toEqual([]);
    expect(host.data[`graduation:${RUN}:plan-day:2026-11-02`]).toBe('{"choice":"keep"}');
    expect(graduated.view.finished[0]?.habit).toMatchObject({
      state: 'graduated',
      checkinDue: false,
      graduated: { day: '2026-11-02', choice: 'keep' },
    });

    // Two weeks later the kept task was ticked off on some days only.
    host.today = '2026-11-16';
    for (const task of dailyHabit('cfg1', '2026-09-15', ['2026-11-03', '2026-11-10']).tasks)
      host.tasks[task.id] = task;
    brain.refresh('tasks');
    const later = await brain.state();
    expect(messages).toEqual([]);
    const due = later.view.finished[0];
    expect(due?.habit?.graduated?.checkDue).toBe('2026-11-16');
    if (!due) throw new Error('no run');

    const said = await brain.write(answerStill(due, host.today, false));
    const suggested = said.view.finished[0];
    expect(suggested?.habit?.graduated).toEqual({
      day: '2026-11-02',
      choice: 'keep',
      suggestBack: true,
    });
    if (!suggested) throw new Error('no run');

    const back = await brain.write(bringBack(suggested, host.today));
    brain.stop();
    expect(JSON.parse(host.data[`graduation:${RUN}:plan-day:2026-11-02`] ?? '')).toEqual({
      choice: 'keep',
      until: '2026-11-16',
    });
    expect(back.view.finished[0]?.habit).toMatchObject({
      state: 'maintained',
      backDay: '2026-11-16',
      canGraduate: false,
    });
    expect(back.view.problems).toEqual([]);
  });
});
