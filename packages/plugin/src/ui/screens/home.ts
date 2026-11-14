import { confirmAnchor, withdraw, type AnchorView, type RunView } from '@questarc/engine';

import { capitalise, planSentence } from '../../shared/plan';
import { newRunId } from '../../shared/run-id';
import { stageAction, t } from '../../shared/texts';
import { h, icon, ICONS } from '../dom';
import { habitBanners } from '../habit-banners';
import { conditionText } from '../journey/card';
import { anchorTitle, suggestedWords } from '../journey/moment';
import type { Context, Screen } from '../screen';
import { readOnlyScreen } from './read-only';

/**
 * Screen 0, the home (docs/behaviour.md, #96): the user's moments, not a
 * list of habits. Each moment says in one line what runs by itself
 * there (no boxes: nothing is ticked for it), what is still followed,
 * and shows the one growing step, which opens its journey (screen 4).
 * Something new starts from a moment (**Extend This Moment**) or from
 * **A New Moment**. A journey from before anchors asks once whether its
 * moment is the user's.
 */

const words = (steps: readonly { journeyId: string; stageId: string }[]): string =>
  steps
    .flatMap((step) => stageAction(step.journeyId, step.stageId) ?? [])
    .map(capitalise)
    .join(' · ');

/** The growing step: its plan, its progress in words and what today looks like. */
const growingStep = (ctx: Context, run: RunView): HTMLElement | null => {
  const { view, journeys } = ctx.state;
  const journey = journeys.find((j) => j.id === run.journeyId);
  const index = run.position.stage;
  const station = run.stations[index];
  const stage = journey?.stages[index];
  if (!station || !stage) return null;
  const bound = station.state === 'current' || station.state === 'met';
  const today = station.lastDays?.find((d) => d.day === view.todayStr)?.mark;
  const state = run.comeBack
    ? t('ui.comeback.title')
    : run.paused
      ? t('ui.anchor.paused')
      : station.state === 'met'
        ? t(run.offer?.quietUntil ? 'ui.card.staying' : 'ui.card.met')
        : station.state === 'unbound'
          ? t('ui.card.unbound')
          : station.state === 'unsupported-repeat'
            ? t('ui.card.unsupported')
            : today === 'done' || today === 'open'
              ? t(`ui.anchor.today.${today}`)
              : undefined;
  return h(
    'button',
    { class: 'qa-growing', type: 'button', onclick: () => ctx.go({ name: 'journey' }) },
    h(
      'span',
      { class: 'qa-overline' },
      `${t('ui.anchor.growing')} · ${t('ui.station.of', { n: index + 1, total: run.stations.length })}`,
    ),
    h('span', { class: 'qa-plan' }, planSentence(stage, station.pair, run.anchor)),
    bound ? h('span', {}, conditionText(stage, station)) : null,
    state ? h('span', { class: 'qa-muted qa-small' }, state) : null,
  ) as HTMLElement;
};

const line = (key: string, text: string): HTMLElement | null =>
  text ? (h('p', { class: 'qa-muted' }, t(key, { steps: text })) as HTMLElement) : null;

const momentCard = (ctx: Context, anchor: AnchorView): HTMLElement => {
  const { view, journeys } = ctx.state;
  const id = anchor.id;
  const button = (label: string, onclick: () => void) =>
    h('button', { class: 'qa-btn qa-btn-secondary', type: 'button', onclick }, label);
  const active = anchor.growing && view.active;
  const followed = anchor.steps.filter((step) => step.state !== 'graduated');
  const waiting = anchor.resting
    .flatMap((step) => journeys.find((j) => j.id === step.journeyId)?.title ?? [])
    .map((title) => t(title))
    .join(' · ');
  const nothing = !active && anchor.steps.length === 0 && !waiting;
  const suggested = anchor.suggest;
  return h(
    'section',
    { class: 'qa-card qa-anchor' },
    h(
      'div',
      { class: 'qa-anchor-head' },
      h('h2', { class: 'qa-section-title' }, anchorTitle(anchor, journeys)),
      id
        ? h(
            'button',
            {
              class: 'qa-icon-btn',
              type: 'button',
              title: t('ui.moment.change'),
              'aria-label': t('ui.moment.change'),
              onclick: () => ctx.go({ name: 'moment', anchorId: id }),
            },
            icon(ICONS.edit),
          )
        : null,
    ),
    line('ui.anchor.by-itself', words(anchor.steps.filter((step) => step.state === 'graduated'))),
    line('ui.anchor.followed', words(followed)),
    active ? growingStep(ctx, active) : null,
    line('ui.anchor.waiting', waiting),
    nothing ? h('p', { class: 'qa-muted' }, t('ui.anchor.nothing')) : null,
    // From before anchors: asked once, in place; nothing depends on the answer.
    suggested
      ? h(
          'div',
          { class: 'qa-stack' },
          h('p', {}, t('ui.anchor.confirm')),
          button(t('ui.anchor.confirm.yes'), () => {
            void ctx.write(
              confirmAnchor(view, {
                journeyId: suggested,
                anchorId: newRunId(),
                anchor: suggestedWords(anchor, journeys),
              }),
            );
          }),
          button(t('ui.anchor.confirm.change'), () =>
            ctx.go({ name: 'moment', anchorId: '', journeyId: suggested }),
          ),
        )
      : null,
    id && !active
      ? button(t('ui.anchor.extend'), () => ctx.go({ name: 'choose', anchorId: id }))
      : null,
  ) as HTMLElement;
};

export const homeScreen = (ctx: Context): Screen => {
  const { view } = ctx.state;
  const readOnly = view.readOnly.find((r) => r.state === 'active');
  if (readOnly) return readOnlyScreen(ctx, readOnly);
  const ended = ctx.draft.ended as { runId: string; title: string } | undefined;
  // The moment that grows comes first.
  const anchors = [...view.anchors].sort(
    (a, b) => Number(b.state === 'growing') - Number(a.state === 'growing'),
  );
  const growing = anchors[0]?.state === 'growing' ? 1 : 0;
  return {
    title: t('ui.app.name'),
    menu: [{ label: t('ui.shelf.title'), onSelect: () => ctx.go({ name: 'shelf' }) }],
    body: h(
      'div',
      { class: 'qa-stack' },
      ended
        ? h(
            'div',
            { class: 'qa-banner', role: 'status' },
            h('p', {}, t('ui.banner.ended', { title: ended.title })),
            h(
              'button',
              {
                class: 'qa-btn qa-btn-text',
                type: 'button',
                onclick: () => {
                  delete ctx.draft.ended;
                  void ctx.write(withdraw(`run-end:${ended.runId}`));
                },
              },
              t('ui.action.undo'),
            ),
          )
        : null,
      // The growing moment stays on top; what is asked about the others follows it.
      ...anchors.slice(0, growing).map((anchor) => momentCard(ctx, anchor)),
      ...habitBanners(ctx),
      ...anchors.slice(growing).map((anchor) => momentCard(ctx, anchor)),
      anchors.length === 0
        ? h(
            'div',
            { class: 'qa-empty' },
            h('h2', { class: 'qa-heading' }, t('ui.home.empty.title')),
            h('p', { class: 'qa-muted' }, t('ui.home.empty.text')),
          )
        : null,
    ),
    actions: [
      h(
        'button',
        {
          class: `qa-btn ${view.active ? 'qa-btn-secondary' : 'qa-btn-primary'}`,
          type: 'button',
          onclick: () => ctx.go({ name: 'choose' }),
        },
        t('ui.anchor.new'),
      ),
    ],
  };
};
