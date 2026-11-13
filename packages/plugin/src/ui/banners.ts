import { isoWeek, resumeJourney, withdraw, type Journey, type RunView } from '@questarc/engine';

import { t } from '../shared/texts';
import { h } from './dom';
import { shortDate } from './journey/format';
import type { Context } from './screen';
import { markSeen, wasSeen } from './seen';

/**
 * Banners on top of the current station's card (docs/behaviour.md,
 * screen 4): paused, a hard week (flow D, with the user's reason and
 * their plan for the obstacle), the weekly look back, a new
 * learning nugget, and the undo after ending a journey.
 */

const banner = (text: string, ...buttons: Node[]): HTMLElement =>
  h('div', { class: 'qa-banner', role: 'status' }, h('p', {}, text), ...buttons) as HTMLElement;

const button = (label: string, onclick: () => void): HTMLElement =>
  h('button', { class: 'qa-btn qa-btn-text', type: 'button', onclick }, label) as HTMLElement;

export const banners = (ctx: Context, run: RunView, journey: Journey): HTMLElement[] => {
  const { view, records } = ctx.state;
  const today = view.todayStr;
  const index = run.position.stage;
  const stage = journey.stages[index];
  const out: HTMLElement[] = [];

  const ended = ctx.draft.ended as { runId: string; title: string } | undefined;
  if (ended) {
    out.push(
      banner(
        t('ui.banner.ended', { title: ended.title }),
        button(t('ui.action.undo'), () => {
          delete ctx.draft.ended;
          void ctx.write(withdraw(`run-end:${ended.runId}`));
        }),
      ),
    );
  }

  if (run.paused) {
    const pauses = Object.keys(records)
      .filter((key) => key.startsWith(`pause:${run.runId}:`))
      .sort();
    const last = pauses.at(-1);
    const byUser = last && (records[last] as { action?: string } | undefined)?.action === 'pause';
    out.push(
      byUser
        ? banner(
            t('ui.banner.paused', { date: shortDate(last.split(':')[2] ?? today) }),
            button(t('ui.action.resume'), () => void ctx.write(resumeJourney(run.runId, today))),
          )
        : banner(t('ui.banner.paused-repeat')),
    );
    return out;
  }

  const fallbackKey = `fallback:${run.runId}:${today}`;
  if (run.offerFallback && !wasSeen(fallbackKey) && stage) {
    const previous = journey.stages[index - 1];
    const text = previous
      ? t('ui.banner.fallback', { action: t(previous.plan.action) })
      : t('ui.banner.fallback-first');
    out.push(
      banner(
        [
          text,
          run.why && t('ui.banner.why', { why: run.why }),
          run.planCheck?.plan && t('ui.check.yours', { plan: run.planCheck.plan }),
        ]
          .filter(Boolean)
          .join(' '),
        button(t('ui.action.good-to-know'), () => {
          markSeen(fallbackKey);
          ctx.redraw();
        }),
      ),
    );
  }

  const weekKey = `checkin:${run.runId}:${stage?.id}:${isoWeek(today)}`;
  if (run.checkinDue && !wasSeen(weekKey)) {
    out.push(
      banner(
        t('ui.banner.checkin'),
        button(t('ui.action.answer'), () => ctx.go({ name: 'checkin' })),
      ),
    );
  }

  const nuggetKey = `nugget:${run.runId}:${stage?.id}`;
  if (stage?.nugget && !wasSeen(nuggetKey) && run.stations[index]?.state !== 'ahead') {
    out.push(
      banner(
        t('ui.banner.nugget', { nugget: t(stage.nugget) }),
        button(t('ui.action.got-it'), () => {
          markSeen(nuggetKey);
          ctx.redraw();
        }),
      ),
    );
  }
  return out;
};
